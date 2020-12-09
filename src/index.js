import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import addWidget from './widget.js';
import app from './application.js';

app().then(() => addWidget());
