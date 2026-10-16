$files = Get-ChildItem .\src -Recurse -Filter *.ts
$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw

    $pattern = '(?:(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s*)?|import\s*\()\s*[''"](?<path>\.{1,2}/[^''"]+)[''"]'

    foreach ($match in [regex]::Matches($content, $pattern)) {
        $specifier = $match.Groups['path'].Value

        if ([IO.Path]::GetExtension($specifier) -ne '') {
            continue
        }

        $basePath = [IO.Path]::GetFullPath(
            (Join-Path $file.DirectoryName $specifier)
        )

        if ((Test-Path "$basePath.ts") -or
            (Test-Path "$basePath.tsx") -or
            (Test-Path "$basePath.d.ts") -or
            (Test-Path (Join-Path $basePath 'index.ts'))) {
            "{0}:{1} -> {2}.js" -f $file.Name, $file.DirectoryName, $specifier
            $count++
        }
    }
}

"Proposed import updates: $count"
