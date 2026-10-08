"""
Sample data for a public demo instance.

`farmdb seed demo` fills a demo with the accounts, farm outline, fields and
crops in features/demo/data.py. The chart runs it after the migrations and
before the API starts, because DuckDB lets only one process write the database
file, so a separate job could not open it while the API holds it.

It refuses to run unless DEMO=true and DEMO_PASSWORD is set, and running it
again changes nothing, so it is safe after every install and every reset.
"""

import asyncio

import typer

app = typer.Typer()


@app.command("demo")
def demo() -> None:
    """Seed the demo accounts, farm outline, fields and crops. Demo instances only."""
    from core.errors import DomainError
    from core.startup import start_core, stop_core
    from features.demo.seed import demo_password, seed_demo

    async def run_seed():
        await start_core()
        try:
            return await seed_demo()
        finally:
            stop_core()

    try:
        # Checked before the database is touched, so a refused run changes nothing.
        demo_password()
        summary = asyncio.run(run_seed())
    except DomainError as error:
        typer.echo(f"✗ Demo seed failed: {error}", err=True)
        raise typer.Exit(1)

    for item in summary.created:
        typer.echo(f"  created  {item}")
    for item in summary.already_present:
        typer.echo(f"  kept     {item}")
    typer.echo(
        f"\n✓ Demo seed done: {len(summary.created)} created, "
        f"{len(summary.already_present)} already present."
    )
