# Moving claimvaluator.com from WordPress

Run these once against the production database, in this order.

1. On WordPress, install the **ClaimValuator Export** plugin and download the JSON file.
   Download `wp-content/uploads` as well.
2. Put the JSON at `migration/claimvaluator-export.json` and the uploads at `migration/uploads/`.
   Neither is committed to git.
3. Run:

   ```
   WP_EXPORT=./migration/claimvaluator-export.json WP_UPLOADS=./migration/uploads pnpm migrate:wp
   ```

   This runs four steps:
   - `import-wordpress.ts` brings in every page, calculator, state page, post, lawyer, category and image. The old image URLs under `/wp-content/uploads/` keep working.
   - `seed-state-guides.ts` (FORCE=1) puts the long state guides back, because the import overwrites state titles and SEO fields.
   - `refresh-state-rules.ts` (ONLY=all) rewrites each state's fact cards, worked example and FAQ from `seed/`, which hold the corrected rules (Maryland and Colorado caps, Oklahoma's 2025 cap, New York dog rule, West Virginia's fault rule).
   - `fix-wv-fault-rule.ts` corrects West Virginia's fault rule in the imported text. W. Va. Code § 55-7-13c(c) is a 51% bar, not 50%.
4. Check every old URL answers 200:

   ```
   node scripts/check-urls.mjs https://your-new-host
   ```

Re-running the import is safe: it updates matching records and reuses images it already made.

Two images in the WordPress export are damaged (`pedestrian-accident-lawyer.webp`, `claimvaluator-logo.png`).
They are skipped and listed at the end of the import. Upload good copies in Admin → Media.
