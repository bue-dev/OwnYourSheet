using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using OwnYourSheet.Api.Data;
using OwnYourSheet.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Authentication (Microsoft Entra External ID) ---
builder.Services.AddAuthentication()
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization();

// --- Database (SQL Server) ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

// --- Services ---
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<EntryService>();
builder.Services.AddScoped<ExportImportService>();
builder.Services.AddScoped<SearchService>();

// --- Controllers ---
builder.Services.AddControllers();

// --- CORS (origins from config — empty in prod = no CORS headers) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AppCors", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (origins.Length > 0)
        {
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// --- Auto-migrate on startup ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseHttpsRedirection();
}
else
{
    app.UseHsts();
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// --- Pipeline ---
app.UseCors("AppCors");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (!app.Environment.IsDevelopment())
{
    app.MapFallbackToFile("index.html");
}

app.Run();
