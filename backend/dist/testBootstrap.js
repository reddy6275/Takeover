async function main() {
    const r = await fetch('http://localhost:3001/api/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    });
    console.log('Status:', r.status);
    const text = await r.text();
    try {
        console.log(JSON.stringify(JSON.parse(text), null, 2));
    }
    catch {
        console.log(text);
    }
}
main();
export {};
