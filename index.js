/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
// Stale debug APKs may still request the old module name until you rebuild native.
if (appName !== 'TickerMobile') {
  AppRegistry.registerComponent('TickerMobile', () => App);
}
