using System.ComponentModel.DataAnnotations;

namespace OwnYourSheet.Api.DTOs;

public record CategoryDto(
    Guid Id,
    string Title,
    int SortOrder,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int EntryCount
);

public record CreateCategoryDto(
    [Required][MaxLength(200)] string Title
);

public record UpdateCategoryDto(
    [Required][MaxLength(200)] string Title
);

public record ReorderItemDto(
    Guid Id,
    int SortOrder
);
