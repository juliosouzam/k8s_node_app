import os from "node:os";
import "dotenv/config";
import Fastify from "fastify";
import { connect } from "mongoose";

import { User } from "./domain/entities/User";

const { MONGO_HOST, MONGO_PORT = 27017, MONGO_DATABASE } = process.env;

const fastify = Fastify({
	logger: true,
});

fastify.get("/healthcheck", (request, reply) => {
	return reply.send({
		uptime: process.uptime(),
		hostname: os.hostname(),
		arch: os.arch(),
		homedir: os.homedir(),
		machine: os.machine(),
		platform: os.platform(),
		release: os.release(),
		tmpdir: os.tmpdir(),
		userInfo: os.userInfo(),
		cpus: os.cpus(),
		cpfUsage: process.cpuUsage(),
	});
});

fastify.get("/users", async (request, reply) => {
	const users = await User.find();

	return reply.send(users);
});

fastify.post<{ Body: { name: string; email: string } }>(
	"/users",
	async (request, reply) => {
		const user = await User.create(request.body);

		return reply.send(user);
	},
);

fastify.get<{ Params: { userId: string } }>(
	"/users/:userId",
	async (request, reply) => {
		const user = await User.findById(request.params.userId);

		return reply.send(user);
	},
);

fastify.put<{
	Params: { userId: string };
	Body: { name: string; email: string };
}>("/users/:userId", async (request, reply) => {
	const user = await User.findByIdAndUpdate(
		request.params.userId,
		request.body,
		{
			new: true,
		},
	);

	return reply.send(user);
});

fastify.delete<{
	Params: { userId: string };
}>("/users/:userId", async (request, reply) => {
	await User.findByIdAndDelete(request.params.userId);

	return reply.send();
});

async function main() {
	await connect(`mongodb://${MONGO_HOST}:${MONGO_PORT}/${MONGO_DATABASE}`);

	try {
		const address = await fastify.listen({ port: 3000, host: "0.0.0.0" });
		console.log(`Server listening on ${address}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

main().catch(fastify.log.error);
