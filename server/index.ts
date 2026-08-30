import { capsule, mutation, query, string, table } from "lakebed/server";
import type { DbRun } from "../shared/runs";

export default capsule({
  name: "Finga",

  // `createdAt` non è un campo: Lakebed lo gestisce come metadata di riga
  // (stringa ISO all'insert) ed è già la forma attesa da `DbRun`.
  schema: {
    runs: table({
      pattern: string(),
      bpm: string(),
      notesPerBeat: string(),
      feedback: string(),
      userId: string(),
    }).index("by_user", ["userId"]),
  },

  queries: {
    myRuns: query(async (ctx) =>
      ctx.db.runs
        .withIndex("by_user", (q) => q.eq("userId", ctx.auth.userId))
        .order("desc")
        .collect()
    ),
  },

  mutations: {
    saveRun: mutation(async (ctx, run: DbRun) => {
      // `run.createdAt` è ignorato: lo scrive Lakebed al momento dell'insert.
      await ctx.db.runs.insert({
        pattern: run.pattern,
        bpm: run.bpm,
        notesPerBeat: run.notesPerBeat,
        feedback: run.feedback,
        userId: ctx.auth.userId,
      });
    }),
  },
});
