import { PostResolver } from "./resolvers/Post";
import "reflect-metadata";
import { HelloResolver } from "./resolvers/hello";
import { __prod__ } from "./constants";
import { MikroORM } from "@mikro-orm/core";
// import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";
import express from "express";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/User";
// import * as http from 'http';
// import * as winston from 'winston';
// import * as expressWinston from 'express-winston';
// import cors from 'cors'
// import {CommonRoutesConfig} from './common/common.routes.config';
// import {UsersRoutes} from './users/users.routes.config';
// import debug from 'debug';
declare module "express-session" {
	interface SessionData {
		userId: number;
	}
}
const main = async () => {
	const orm = await MikroORM.init(microConfig);
	await orm.getMigrator().up();

	const app = express();

	const RedisStore = connectRedis(session);
	const redisClient = redis.createClient();

	app.use(
		session({
			name: "qid",
			store: new RedisStore({
				client: redisClient,
				disableTouch: true
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 year
				httpOnly: true,
				sameSite: "lax",
				secure: __prod__
			},
			secret: "addasdasdsadasffdsfs",
			saveUninitialized: false,
			resave: false
		})
	);
	const apolloServer = new ApolloServer({
		schema: await buildSchema({
			resolvers: [HelloResolver, PostResolver, UserResolver],
			validate: false
		}),
		context: ({ req, res }) => ({ em: orm.em, req, res })
	});
	apolloServer.applyMiddleware({ app });
	app.listen(process.env.NODE_ENV || 4000, () => {
		console.log("Server Start 4000");
	});
};
main().catch((err) => {
	console.log(err);
});
// const server: http.Server = http.createServer(app);
// const port = 3000;
// const routes: Array<CommonRoutesConfig> = [];
// const debugLog: debug.IDebugger = debug('app');

// app.use(express.json())
// app.use(cors());

// const loggerOptions: expressWinston.LoggerOptions = {
//     transports: [new winston.transports.Console()],
//     format: winston.format.combine(
//         winston.format.json(),
//         winston.format.prettyPrint(),
//         winston.format.colorize({ all: true })
//     ),
// };

// if (process.env.DEBUG) {
//     process.on('unhandledRejection', function(reason) {
//         debugLog('Unhandled Rejection:', reason);
//         process.exit(1);
//     });
// } else {
//     loggerOptions.meta = false; // when not debugging, make terse
// }

// app.use(expressWinston.logger(loggerOptions));

// routes.push(new UsersRoutes(app));

// app.get('/', (_req: express.Request, res: express.Response) => {
//     res.status(200).send(`Server running at http://localhost:${port}`)
// });
// server.listen(port, () => {
//     debugLog(`Server running at http://localhost:${port}`);
//     routes.forEach((route: CommonRoutesConfig) => {
//         debugLog(`Routes configured for ${route.getName()}`);
//     });
// });
