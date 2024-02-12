import opentelemetry from "@opentelemetry/api";
import { tracer } from "./tracer";

type OpenTelemetryTracer = ReturnType<typeof opentelemetry.trace.getTracer>;

/**
 * A decorator that enables Datadog tracing on a method.
 * @param method
 */
export function tracing(
	// tracer: OpenTelemetryTracer,
): (
	// biome-ignore lint/complexity/noBannedTypes: <explanation>
	target: Function,
	methodName: string,
	descriptor: PropertyDescriptor,
) => void {
	return (
		// biome-ignore lint/complexity/noBannedTypes: <explanation>
		target: Function,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) => {
		const className: string = target.constructor.name; // correct type: Function
		// eslint-disable-next-line @typescript-eslint/ban-types
		// biome-ignore lint/complexity/noBannedTypes: <explanation>
		const originalMethod: Function = descriptor.value;

		descriptor.value = function (...args: unknown[]) {
			return tracer.startActiveSpan(
				`${className}.${propertyKey}`,
				{},
				async (span) => {
					try {
						return await originalMethod.apply(this, args);
					} catch (err) {
						span.recordException(err as Error);
						throw err;
					} finally {
						span.end();
					}
				},
			);
		};
	};
}
