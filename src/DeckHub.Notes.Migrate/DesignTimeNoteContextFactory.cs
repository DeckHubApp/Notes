using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using DeckHub.Notes.Data;

namespace DeckHub.Notes.Migrate
{
    public class DesignTimeNoteContextFactory : IDesignTimeDbContextFactory<NoteContext>
    {
        public const string LocalPostgres = "Host=localhost;Database=notes;Username=deckhub;Password=secretsquirrel";

        public static readonly string MigrationAssemblyName =
            typeof(DesignTimeNoteContextFactory).Assembly.GetName().Name;

        public NoteContext CreateDbContext(string[] args)
        {
            var builder = new DbContextOptionsBuilder()
                .UseNpgsql(args.FirstOrDefault() ?? LocalPostgres, b => b.MigrationsAssembly(MigrationAssemblyName));
            return new NoteContext(builder.Options);
        }
    }
}