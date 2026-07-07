async function main() {
  const companyId = '47e5b22b-2e9b-44bb-9426-b81665a31c51'; // Acme Corp (Customer Support)
  
  const r = await fetch('http://localhost:3001/api/chat/message', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      company_id: companyId,
      sender: 'customer',
      content: 'What is your refund policy?',
      customer_email: 'test@example.com',
      customer_name: 'Test User'
    })
  });
  
  console.log('Status:', r.status);
  const text = await r.text();
  try {
    const json = JSON.parse(text);
    console.log('conversation_id:', json.conversation_id);
    console.log('user_message:', json.user_message?.content?.substring(0, 100));
    console.log('ai_message:', json.ai_message?.content?.substring(0, 300));
    console.log('escalated:', json.escalated);
  } catch {
    console.log(text.substring(0, 500));
  }
}
main();
