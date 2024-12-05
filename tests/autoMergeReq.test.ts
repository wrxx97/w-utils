import { expect, test } from "vitest";
import { createAutoMergedRequest } from "../lib/main";

test("test createAutoMergedRequest", async () => {
  let ret: number[] = [];
  const req = createAutoMergedRequest(
    (mergedParams: number[]): Promise<number[]> => {
      return new Promise((r) => {
        setTimeout(() => {
          console.log(mergedParams);
          ret = mergedParams.map((i) => i + 1);
          r(ret);
        }, 20);
      });
    },
    {
      timeout: 100,
      interval: 20,
    }
  );

  let s = performance.now();

  {
    const p1 = req(1);
    const p2 = req(2);
    const p3 = req(3);

    await Promise.all([p1, p2, p3]).then(() => {
      expect(ret).toEqual([2, 3, 4]);
    });
  }

  {
    const p1 = req(1);
    const p2 = req(2);
    const p3 = req(3);
    const p4 = new Promise((r) => {
      setTimeout(() => {
        req(4);
        r(0);
      }, 10);
    });

    await Promise.all([p1, p2, p3, p4]).then(() => {
      expect(ret).toEqual([2, 3, 4, 5]);
    });
  }

  {
    const p1 = req(1);
    const p2 = req(2);
    const p3 = req(3);
    const p4 = new Promise((r) => {
      setTimeout(() => {
        req(4);
        r(0);
      }, 150);
    });

    await Promise.all([p1, p2, p3]).then(() => {
      expect(ret).toEqual([2, 3, 4]);
    });
  }
});
