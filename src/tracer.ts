import { trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { Resource } from "@opentelemetry/resources";
import {
	ConsoleMetricExporter,
	PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const exporter = new OTLPTraceExporter({
	url: "http://localhost:4318/v1/traces",
	// concurrencyLimit: 10,
});

export const sdk = new NodeSDK({
	resource: new Resource({
		[SemanticResourceAttributes.SERVICE_NAME]: "node_app",
		[SemanticResourceAttributes.SERVICE_VERSION]: "1.0",
	}),
	traceExporter: exporter,
	instrumentations: [new HttpInstrumentation()],
	metricReader: new PeriodicExportingMetricReader({
		exporter: new ConsoleMetricExporter(),
	}),
});

sdk.start();

export const tracer = trace.getTracer("default");
