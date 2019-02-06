export class MixResult {
    public readonly bufferSize: number;
    public readonly output: number[][];

    constructor(bufferSize: number, output: number[][]) {
        this.bufferSize = bufferSize;
        this.output = output;
    }
}
