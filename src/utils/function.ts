export interface Ctor<TParams extends unknown[], TInst> {
    new(...params: TParams): TInst
}

export interface Factory<TParams extends unknown[], TInst> {
    (...params: TParams): TInst
}

export const isCtor = <TParams extends unknown[], TInst>(f: Initor<TParams, TInst>): f is Ctor<TParams, TInst> =>
    f.prototype && f.prototype.constructor === f;

export type Initor<TParams extends unknown[], TInst> =
    | Ctor<TParams, TInst>
    | Factory<TParams, TInst>;

export const initWith = <TParams extends unknown[], TInst>(
    initor: Initor<TParams, TInst>,
    params: TParams,
) => {
    if (isCtor(initor)) {
        // eslint-disable-next-line new-cap
        return new initor(...params);
    }
    return initor(...params);
};

