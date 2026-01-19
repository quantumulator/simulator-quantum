import type { ForgeConfig } from '@electron-forge/shared-types';
import path from 'path';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerWix } from '@electron-forge/maker-wix';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: path.join(__dirname, 'icon'),
    extraResource: [
      path.join(__dirname, '../../out'), // Include Next.js export
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'quantumflow',
      setupIcon: path.join(__dirname, 'icon.ico'),
    }),
    new MakerWix({
      language: 1033,
      manufacturer: 'QuantumFlow Team',
      description: 'QuantumFlow Simulation Environment',
      name: 'QuantumFlow',
      shortcutName: 'QuantumFlow',
      ui: {
        chooseDirectory: true,
      },
      // Give it the icon explicitly to avoid the extraction error
      icon: path.join(__dirname, 'icon.ico'),
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        bin: 'quantumflow',
      }
    }, ['linux']),
    new MakerDeb({
      options: {
        bin: 'quantumflow',
        maintainer: 'QuantumFlow Team',
        homepage: 'https://quantumflow.com'
      }
    }, ['linux']),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
