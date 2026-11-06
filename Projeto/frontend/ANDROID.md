# Habitare — app Android (MVP)

O app Android é **o mesmo código do site** (React + Vite) empacotado como aplicativo com o
**Capacitor**. Não existe um segundo projeto para manter: o que muda no site muda no app
depois de gerar uma nova versão. O rascunho antigo em Kotlin (versão 1 no Play Console) foi
substituído por este app a partir da **versão 2 (2.0.0)**.

## Ferramentas e versões

| Ferramenta | Versão | Para quê |
|---|---|---|
| Capacitor (`@capacitor/core`, `android`, `cli`) | 8.6.0 | Transforma o site em app Android |
| `@capacitor/app` | 8.1.2 | Botão "voltar" do celular e volta do login com Google |
| `@capacitor/browser` | 8.0.5 | Abre o login do Google numa aba do Chrome |
| `@capacitor/status-bar` | 8.0.4 | Barra de status escura |
| Java (Eclipse Temurin) | 21.0.13 | Necessário para compilar o Android |
| Android SDK (command-line tools) | plataforma 36, build-tools 36/35 | Compilar e assinar o app |
| Gradle | 8.14.3 (baixado sozinho pelo `gradlew`) | Sistema de build do Android |
| Emulador | Android 36 (Google Play, x86_64), AVD `Habitare_Teste` | Testar sem celular |

Não é preciso o Android Studio (no Windows ele é o jeito mais fácil: já traz Java, SDK e emulador;
Java em `C:\Program Files\Android\Android Studio\jbr`, SDK em `%LOCALAPPDATA%\Android\Sdk`). No Mac do Davi as ferramentas ficam em:
- Java: `~/.local/share/habitare-ferramentas/jdk/Contents/Home`
- Android SDK: `~/Library/Android/sdk`

## Configuração do app

- Pacote: **`br.com.habitare.app`** (o mesmo do app no Play Console). Arquivo: `capacitor.config.json`.
- Versão: `android/app/build.gradle` → `versionCode` (número que **precisa aumentar a cada envio** ao Play) e `versionName` (o que o usuário vê).
- Ícone e tela de abertura: reaproveitados do app Kotlin (`android/app/src/main/res`).
- O endereço do Supabase e a chave pública vêm do `.env.local` do site no momento do build.

## Login com Google no app

O Google bloqueia login feito dentro da tela interna de um app. Por isso, no app:
1. O botão "Entrar com Google" abre o login numa **aba do Chrome** (`src/services/appNativo.js`).
2. Depois de escolher a conta, o Google/Supabase volta para o endereço **`br.com.habitare.app://login`**.
3. O Android entrega esse endereço ao app (filtro no `AndroidManifest.xml`), o app grava a sessão
   e segue o mesmo caminho do site: com cadastro vai para o painel; sem cadastro, para o cadastro de morador.

Configuração necessária (uma vez só):
- Supabase → Authentication → URL Configuration → **Redirect URLs**: `br.com.habitare.app://login`
- Supabase → Authentication → Providers → Google: ligado com o cliente **Web** do projeto Google Cloud `habitare-509411` (o mesmo usado pelo site).
- Como o app usa o cliente Web pelo navegador, **não depende do SHA-1** das chaves Android.

## Assinatura (chave de envio)

O Play Console só aceita versões novas assinadas com a **mesma chave de envio** do app
(`habitare-upload.jks`, SHA-1 `CA:25:5F:9C:61:08:51:1E:1D:83:92:15:4A:F1:EB:0D:50:F1:1D:36`).
O Play reassina o app com a chave dele (Play App Signing).

O build lê `android/keystore.properties` (fica **só no computador**, está no `.gitignore`):

```
storeFile=/caminho/para/habitare-upload.jks
storePassword=********
keyAlias=upload
keyPassword=********
```

Nunca commitar o `.jks` nem o `keystore.properties`. Se a chave for perdida, só o dono da
conta do Play Console consegue pedir ao Google uma chave de envio nova.

## Como gerar o app

Na pasta `Projeto/frontend`:

```bash
export JAVA_HOME=~/.local/share/habitare-ferramentas/jdk/Contents/Home
export ANDROID_HOME=~/Library/Android/sdk

npm run build              # gera o site em dist/
npx cap sync android       # copia o site para dentro do app

cd android
./gradlew assembleDebug    # APK de teste: app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease    # para o Play: app/build/outputs/bundle/release/app-release.aab
```

Instalar o APK de teste no emulador ou num celular ligado por USB (com "Depuração USB" ativa):

```bash
~/Library/Android/sdk/platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Abrir o emulador: `~/Library/Android/sdk/emulator/emulator -avd Habitare_Teste`

## Publicar para testes (Play Console)

1. Aumentar o `versionCode` em `android/app/build.gradle` e gerar o `bundleRelease`.
2. Play Console (conta do professor, app **Habitare**) → **Testar e lançar → Teste interno → Criar nova versão**.
3. Enviar o `app-release.aab`, escrever as notas da versão e **publicar na faixa**.
4. Testadores: e-mail na lista **"Testadores - Habitare"** (aba Testadores). Cada testador precisa
   abrir o **link de participação** ("Participar na Web" → Copiar link), aceitar e só então instalar
   pela Play Store, com a **mesma conta Google** do celular.

Teste interno: até 100 testadores, a versão chega em minutos, sem revisão do Google.
Para um teste beta maior existe o **teste fechado** (passa por revisão). Em contas pessoais do Play
Console, ir para a produção exige antes um teste fechado com pelo menos 12 testadores por 14 dias.

## Exigências do Play para o teste fechado

- **Política de privacidade:** `Projeto/PRIVACIDADE.md` (o link do GitHub vai no Play Console).
- **Exclusão de conta dentro do app:** Perfil → Segurança → "Excluir minha conta" (`src/components/ExcluirConta.jsx`).
  A Equipe Habitare conclui em `/exclusoes-conta` (`src/pages/ExclusoesConta.jsx`); banco na migração
  `20261106120000_pedidos_exclusao_conta.sql` (RPCs `solicitar_exclusao_conta`, `cancelar_exclusao_conta`,
  `pedidos_exclusao_para_dev`, `concluir_exclusao_conta`). Não existe "negar"; conta de Master com condomínio é barrada.
- **Respostas de todos os formulários:** `PLAY-CONSOLE.md`.
- **Capturas de tela:** tiradas do app no emulador (`adb exec-out screencap -p > tela.png`), aparelho 1080×1920.

## Emulador no Mac antigo

No Mac do Davi o emulador abre, o app instala e inicia (logcat: "Capacitor: App started"), mas a tela fica
preta: o System UI do Android trava ("Application Not Responding: com.android.systemui") por falta de
desempenho/vídeo. Não é problema do app; testes no emulador ficam para o desktop.
