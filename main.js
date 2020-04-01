const { resolve, basename } = require('path');
const { app, Menu, Tray, dialog, MenuItem } = require('electron');
const spawn = require('cross-spawn');

const Store = require('electron-store');

const schema = {
  projects: {
    type: 'string',
  },
};
const store = new Store({ schema });

// app.dock.hide();

app.on('ready', () => {
  const tray = new Tray(resolve(__dirname, 'assets', 'iconTemplate.png'));
  const storedProjects = store.get('projects');
  const projects = storedProjects ? JSON.parse(storedProjects) : [];

  const items = projects.map(project => ({
    label: project.name,
    click: () => {
      spawn.sync('code', [project.path]);
    },
  }));

  const contextMenu = Menu.buildFromTemplate([
    ...items,
    {
      type: 'separator',
    },
  ]);

  contextMenu.insert(
    0,
    new MenuItem({
      label: 'Adicionar novo projeto...',
      click: () => {
        const [path] = dialog.showOpenDialog({
          properties: ['openDirectory'],
        });
        const name = basename(path);
        store.set(
          'projects',
          JSON.stringify([
            ...projects,
            {
              path,
              name,
            },
          ])
        );

        const item = new MenuItem({
          label: name,
          click: () => {
            spawn.sync('code', [path]);
          },
        });
        contextMenu.append(item);
      },
    })
  );

  tray.setToolTip('My Application');
  tray.setContextMenu(contextMenu);
});
