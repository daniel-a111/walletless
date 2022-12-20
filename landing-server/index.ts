import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import routes from './src/routes';
import cors from 'cors';
import bodyParser from 'body-parser';
import { sequelize } from './src/models';

const app: Express = express();
const port = process.env.PORT;

app.use(express.json({limit: '25mb'}));
app.use(express.urlencoded({limit: '25mb'}));
app.use(bodyParser.json());

app.use(cors({
    origin: '*', methods: '*'
}));


app.use('/', routes);
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

(async() => {
  await sequelize.sync({force: false});
})();