using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using DeckHub.Notes.Data;
using DeckHub.Notes.Models;

namespace DeckHub.Notes.Controllers
{
    [Route("")]
    [Authorize]
    public class NotesController : Controller
    {
        private readonly ILogger<NotesController> _logger;
        private readonly NoteContext _context;

        public NotesController(NoteContext context, ILogger<NotesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("{place}/{presenter}/{slug}/{number}")]
        public async Task<ActionResult<NoteDto>> GetForSlide(string place, string presenter, string slug, int number,
            CancellationToken ct)
        {
            var slideIdentifier = $"{place}/{presenter}/{slug}/{number}";
            var user = User.FindFirstValue(DeckHubClaimTypes.Handle);
            try
            {
                var existingNote = await _context.Notes
                    .SingleOrDefaultAsync(n => n.UserHandle == user && n.SlideIdentifier == slideIdentifier, ct)
                    .ConfigureAwait(false);

                if (existingNote == null) return NotFound();

                return NoteDto.FromNote(existingNote);
            }
            catch (Exception ex)
            {
                _logger.LogError(EventIds.DatabaseError, ex, ex.Message);
                throw;
            }
        }

        [HttpPut("{place}/{presenter}/{slug}/{number}")]
        public async Task<IActionResult> SetForSlide(string place, string presenter, string slug, int number,
            [FromBody] NoteDto note, CancellationToken ct)
        {
            var slideIdentifier = $"{place}/{presenter}/{slug}/{number}";
            var user = User.FindFirstValue(DeckHubClaimTypes.Handle);

            var existingNote = await _context.Notes
                .SingleOrDefaultAsync(n => n.UserHandle == user && n.SlideIdentifier == slideIdentifier, ct)
                .ConfigureAwait(false);

            if (existingNote == null)
            {
                existingNote = new Note
                {
                    Public = false,
                    SlideIdentifier = slideIdentifier,
                    UserHandle = user
                };
                _context.Notes.Add(existingNote);
            }

            existingNote.NoteText = note.Text;
            existingNote.Timestamp = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(ct).ConfigureAwait(false);
            return Accepted();
        }
    }
}