using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using OwnYourSheet.Api.Data;
using OwnYourSheet.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Authentication (Microsoft Entra External ID) ---
builder.Services.AddAuthentication()
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization();

// --- Database ---
var dbPath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
    "OwnYourSheet",
    "ownyoursheet.db"
);
Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// --- Services ---
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<EntryService>();
builder.Services.AddScoped<ExportImportService>();
builder.Services.AddScoped<SearchService>();

// --- Controllers ---
builder.Services.AddControllers();

// --- CORS (for Angular dev server) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// --- Swagger (can be added later if needed) ---

var app = builder.Build();

// --- Auto-migrate on startup ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// --- Pipeline ---
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevCors");
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
