using System.ComponentModel.DataAnnotations;
using OwnYourSheet.Api.Models;

namespace OwnYourSheet.Api.DTOs;

public record EntryDto(
    Guid Id,
    Guid CategoryId,
    string Title,
    string Content,
    EntryType EntryType,
    string? Language,
    List<EntryVariableDto> Variables,
    int SortOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record EntryVariableDto(
    string Name,
    string DefaultValue
);

public record CreateEntryDto(
    [Required] Guid CategoryId,
    [Required][MaxLength(300)] string Title,
    [Required] string Content,
    EntryType EntryType = EntryType.Text,
    string? Language = null,
    List<EntryVariableDto>? Variables = null
);

public record UpdateEntryDto(
    [MaxLength(300)] string? Title = null,
    string? Content = null,
    EntryType? EntryType = null,
    string? Language = null,
    List<EntryVariableDto>? Variables = null
);
