// These imports are for all client side views

import '../styles/animate.css';
import '../styles/bootstrap-colors-extended.css';
import '../styles/bs-overwrite.css';
import '../styles/global.css';
import '../styles/style.css';
import './deps';

// socket
import './socket';

// settings
import './settings';

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
