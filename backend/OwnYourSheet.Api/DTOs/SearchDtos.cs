using OwnYourSheet.Api.Models;

namespace OwnYourSheet.Api.DTOs;

public record SearchResultDto(
    Guid Id,
    string Title,
    string Content,
    EntryType EntryType,
    string? Language,
    Guid CategoryId,
    string CategoryTitle
);
