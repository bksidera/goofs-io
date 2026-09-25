// Crypto arc content bundle — everything a hypothetical alternate arc
// would swap out (data, copy, ending scene, per-stage mechanics).
//
// The engine's ArcScreen currently still reaches into these files directly for
// backward compatibility during the split; the goal is that only this bundle
// and theme.css are what a new arc author touches.

import data from './data.json';
import * as copy from './copy.js';
import Aftermath from './aftermath.jsx';
import TemperatureGauge from './mechanics/TemperatureGauge.jsx';
import WizardAura from './mechanics/WizardAura.jsx';
import ApocalypseSequence from './mechanics/ApocalypseSequence.jsx';
import AirdropEvent from './mechanics/AirdropEvent.jsx';

const cryptoArc = {
  id: 'crypto',
  title: 'Crypto Clicker',
  data,
  copy,
  Aftermath,
  mechanics: {
    TemperatureGauge,
    WizardAura,
    ApocalypseSequence,
    AirdropEvent,
  },
};

export default cryptoArc;
