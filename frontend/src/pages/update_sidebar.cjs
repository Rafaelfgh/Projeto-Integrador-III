const fs = require('fs');
const files = [
  'Dashboard.jsx', 'Ocorrencia.jsx', 'Reclamacao.jsx', 
  'FeedOcorrencias.jsx', 'MinhasSolicitacoes.jsx', 
  'Perfil.jsx', 'PainelSindico.jsx'
];

files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace <aside> ... </aside>
    const newAside = '<Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />';
    if (content.match(/<aside[\s\S]*?<\/aside>/)) {
       content = content.replace(/<aside[\s\S]*?<\/aside>/, newAside);
    }
    
    // Add Sidebar to imports, before './Dashboard.css'
    if (!content.includes('import Sidebar from')) {
      content = content.replace(/import NotificationMenu from '\.\.\/components\/NotificationMenu';/g, 
          'import NotificationMenu from \'../components/NotificationMenu\';\nimport Sidebar from \'../components/Sidebar\';');
    }
    
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  } catch(e) {
    console.log("Error processing " + f + ": " + e);
  }
});
