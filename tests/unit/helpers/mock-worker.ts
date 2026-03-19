import { vi } from "vitest";

/**
 * Creates a mock Worker class that captures postMessage calls
 * and allows tests to simulate worker responses.
 */
export function createMockWorkerClass() {
	let lastInstance: MockWorkerInstance | null = null;

	class MockWorkerInstance {
		onmessage: ((e: MessageEvent) => void) | null = null;
		onerror: ((e: ErrorEvent) => void) | null = null;
		terminate = vi.fn();
		postMessage = vi.fn();

		private listeners = new Map<string, Set<EventListener>>();

		constructor() {
			// biome-ignore lint/suspicious/noAssignInExpressions: test helper captures last instance
			lastInstance = this;
		}

		addEventListener(
			type: string,
			listener: EventListener,
			_options?: AddEventListenerOptions,
		) {
			if (!this.listeners.has(type)) {
				this.listeners.set(type, new Set());
			}
			this.listeners.get(type)!.add(listener);
		}

		removeEventListener(type: string, listener: EventListener) {
			this.listeners.get(type)?.delete(listener);
		}

		/** Simulate a successful response from the worker */
		simulateMessage(data: Record<string, unknown>) {
			this.onmessage?.({ data } as MessageEvent);
		}

		/** Simulate a worker error */
		simulateError(message: string) {
			this.onerror?.({ message } as ErrorEvent);
		}
	}

	const MockWorker = MockWorkerInstance as unknown as typeof Worker;

	return {
		MockWorker,
		getLastInstance: () => lastInstance as MockWorkerInstance,
	};
}
