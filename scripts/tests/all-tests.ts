import { assertEquals } from "https://deno.land/std@0.205.0/assert/mod.ts";
import { test } from "./db-speed.ts";
import { __root } from "../../server/utilities/env.ts";
import '../init.ts';


export const runTests = async () => {
    Deno.test('Database Speed and Reliability', () => {
        const num = 1000;
        const result = test(num);
        assertEquals(result, num);
    });
}