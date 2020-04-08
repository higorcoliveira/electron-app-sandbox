const { resolve, basename } = require('path');
const { app, Menu, Tray, dialog } = require('electron');
const util = require('./util');
const fixPath = require('fix-path');
const { spawn } = require('child_process');

const Store = require('electron-store');

fixPath();

const schema = {
  projects: {
    type: 'string',
  },
};

let mainTray = {};

if (app.dock) {
  app.dock.hide();
}

const store = new Store({ schema });

function render(tray = mainTray) {
  const storedProjects = store.get('projects');
  const projects = storedProjects ? JSON.parse(storedProjects) : [];
  const locale = util.getLocale(app);

  const items = projects.map(({ name, path }) => ({
    label: name,
    submenu: [
      {
        label: locale.open,
        click: () => {
          spawn('code', [path], { shell: true });
        },
      },
      {
        label: locale.remove,
        click: () => {
          store.set(
            'projects',
            JSON.stringify(projects.filter((item) => item.path !== path))
          );
          render();
        },
      },
    ],
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: locale.add,
      click: () => {
        const result = dialog.showOpenDialogSync({ properties: ['openDirectory'] });

        if (!result) return;

        console.log(result);
        const [path] = result;
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

        render();
      },
    },
    {
      type: 'separator',
    },
    ...items,
    {
      type: 'separator',
    },
    {
      type: 'normal',
      label: locale.close,
      role: 'quit',
      enabled: true,
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', tray.popUpContextMenu);
}

app.on('ready', () => {
  mainTray = new Tray(resolve(__dirname, 'assets', 'iconTemplate.png'));

  render(mainTray);
});
