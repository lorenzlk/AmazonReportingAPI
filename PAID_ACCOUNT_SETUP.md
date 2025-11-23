# Pipedream Paid Account - Step Timeout Configuration

Since you have a **paid Pipedream account**, you can extend step timeouts much longer.

## How to Extend Step Timeout

1. **In your Pipedream workflow**, click on your scraper step
2. Click the **gear icon** (⚙️) or **"Settings"** button
3. Look for **"Timeout"** or **"Execution timeout"** setting
4. Set it to:
   - **60 seconds** (recommended - gives plenty of buffer)
   - **120 seconds** (if you want extra safety)
   - **300 seconds** (5 minutes - maximum if needed)

## What I've Updated

Since you have a paid account, I've made the code **less aggressive** and more reliable:

- **Dashboard wait**: 10 seconds (was 2 seconds)
- **Account switching**: 10 seconds max (was 6 seconds)
- **Account switcher detection**: 5 seconds (was 2 seconds)

This gives Amazon's pages more time to load properly while still being efficient.

## Recommended Settings

**Step Timeout**: 60 seconds
- Login: ~8 seconds
- Navigation: ~2 seconds  
- Account switch: ~5-10 seconds
- Dashboard wait: ~5-10 seconds
- Data extraction: ~2 seconds
- Cleanup: ~1 second
- **Total: ~25-35 seconds** (well under 60s limit)

## Next Steps

1. **Extend step timeout to 60 seconds** in Pipedream UI
2. **Test the workflow** - it should complete successfully
3. If it still times out, increase to 120 seconds

The code is now optimized for a paid account with more reasonable timeouts!

