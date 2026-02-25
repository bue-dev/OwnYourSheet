using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OwnYourSheet.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Entries",
                type: "TEXT",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Categories",
                type: "TEXT",
                maxLength: 128,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Entries_UserId",
                table: "Entries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_UserId",
                table: "Categories",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Entries_UserId",
                table: "Entries");

            migrationBuilder.DropIndex(
                name: "IX_Categories_UserId",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Entries");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Categories");
        }
    }
}
