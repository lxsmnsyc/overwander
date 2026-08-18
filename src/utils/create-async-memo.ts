import { createEffect, createSignal, untrack } from 'solid-js';

export type Result<T> =
  | { type: 'pending'; value?: Promise<T> }
  | { type: 'failure'; value: unknown }
  | { type: 'success'; value: T };

export function createAsyncMemo<Source, Value>(
  source: () => Source,
  result: (source: Source) => Value | Promise<Value>,
): { value: () => Result<Value>; refetch: () => void } {
  const [current, setCurrent] = createSignal<Result<Value>>({
    type: 'pending',
  });
  const [refetch, setRefetch] = createSignal(
    {},
    {
      equals: false,
    },
  );

  createEffect(() => {
    refetch();

    const value = source();

    const promise = untrack(async () => Promise.resolve(result(value)));
    setCurrent({
      type: 'pending',
      value: promise,
    });

    promise.then(
      (target) =>
        setCurrent({
          type: 'success',
          value: target,
        }),
      (target: unknown) =>
        setCurrent({
          type: 'failure',
          value: target,
        }),
    );
  });

  return {
    value: current,
    refetch: () => {
      setRefetch({});
    },
  };
}
