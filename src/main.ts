import os from "node:os";
import "dotenv/config";
import Fastify from "fastify";
import { connect } from "mongoose";

import { User } from "./domain/entities/User";
import { sdk, tracer } from "./tracer";

const { MONGO_HOST, MONGO_PORT = 27017, MONGO_DATABASE } = process.env;

const fastify = Fastify({
	logger: true,
});

fastify.get("/healthcheck", (request, reply) => {
	const params = tracer.startActiveSpan("healthcheck", (span) => {
		const params = {
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
		};
		span.end();
		return params;
	});

	return reply.send(params);
});

fastify.get("/users", async (request, reply) => {
	const users = await tracer.startActiveSpan("users.index", async (span) => {
		const users = await User.find();

		span.end();
		return users;
	});

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

	process.on("SIGTERM", async () => {
		await fastify.close();
		sdk
			.shutdown()
			.then(() => console.log("Tracing terminated"))
			.catch((error) => console.log("Error terminating tracing", error))
			.finally(() => process.exit(0));
	});

	try {
		const address = await fastify.listen({ port: 3000, host: "0.0.0.0" });
		console.log(`Server listening on ${address}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
}

main().catch(fastify.log.error);
