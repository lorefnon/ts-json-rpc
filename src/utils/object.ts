export function mapEntries(
    input: any, 
    map: (member: any) => [PropertyKey, any] | null,
) {
    return Object.fromEntries(
        Object
            .entries(input)
            .map(map)
            .filter(Boolean) as [PropertyKey, any]
    );
}

