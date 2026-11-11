// Comportamentos que só existem no app Android (Capacitor), sem efeito no site.
//  - Login com Google: o Google não deixa logar dentro da tela interna do app, então o
//    login abre numa aba do Chrome e volta para o app pelo endereço br.com.habitare.app://login
//    (cadastrado em "Redirect URLs" do Supabase). Na volta, a sessão é gravada e o app
//    segue o mesmo caminho do site (tela de login decide: painel ou cadastro de morador).
//  - Botão "voltar" do celular: volta uma tela; na primeira tela, fecha o app.
//  - Barra de status escura, como o topo do site.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { StatusBar, Style } from '@capacitor/status-bar';
import { supabase } from '../backend/supabaseClient';

export const ehApp = Capacitor.isNativePlatform();
export const RETORNO_APP = 'br.com.habitare.app://login';

// Abre o login do Google no Chrome; a volta é tratada em iniciarAppNativo
export const entrarComGoogleNoApp = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: RETORNO_APP, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;
  await Browser.open({ url: data.url });
};

// Quando o usuário fecha a aba do Chrome sem entrar
export const aoFecharNavegador = (fn) => {
  if (!ehApp) return () => {};
  const ouvinte = Browser.addListener('browserFinished', fn);
  return () => { ouvinte.then(o => o.remove()); };
};

// Lê os parâmetros da volta do Google (vêm depois de "?" ou de "#")
const lerRetorno = (url) => {
  const [antesHash, hash = ''] = url.split('#');
  const query = antesHash.split('?')[1] || '';
  return new URLSearchParams(`${query}&${hash}`);
};

export const iniciarAppNativo = () => {
  if (!ehApp) return;

  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#121417' }).catch(() => {});

  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(RETORNO_APP)) return;
    const p = lerRetorno(url);
    try {
      if (p.get('error_description')) throw new Error(p.get('error_description'));
      if (p.get('code')) {
        const { error } = await supabase.auth.exchangeCodeForSession(p.get('code'));
        if (error) throw error;
      } else if (p.get('access_token') && p.get('refresh_token')) {
        const { error } = await supabase.auth.setSession({
          access_token: p.get('access_token'), refresh_token: p.get('refresh_token'),
        });
        if (error) throw error;
      }
      await Browser.close().catch(() => {});
      window.location.replace('/login'); // a tela de login leva ao painel ou ao cadastro
    } catch (err) {
      console.error('Erro na volta do Google:', err);
      await Browser.close().catch(() => {});
      window.location.replace('/login?error_description=google');
    }
  });

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else App.exitApp();
  });
};
