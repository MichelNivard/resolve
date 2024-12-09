require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const authRoute = require('./api/auth');
const getTokenRoute = require('./api/getToken');
const fetchFileRoute = require('./api/fetchFile');
const saveFileRoute = require('./api/saveFile');
const lockFileRoute = require('./api/lockFile');
const unlockFileRoute = require('./api/unlockFile');
const commentsRoute = require('./api/comments');

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoute);
app.use('/api/getToken', getTokenRoute);
app.use('/api/fetchFile', fetchFileRoute);
app.use('/api/saveFile', saveFileRoute);
app.use('/api/lockFile', lockFileRoute);
app.use('/api/unlockFile', unlockFileRoute);
app.use('/api/comments', commentsRoute);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
