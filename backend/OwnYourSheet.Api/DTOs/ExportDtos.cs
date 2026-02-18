namespace OwnYourSheet.Api.DTOs;

public record ExportDataDto(
    DateTime ExportedAt,
    string Version,
    List<ExportCategoryDto> Categories
);

public record ExportCategoryDto(
    Guid Id,
    string Title,
    int SortOrder,
    List<EntryDto> Entries
);
