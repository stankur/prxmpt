import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { APIError } from 'openai';
import jsonata from 'jsonata';

export async function POST(request: NextRequest) {
  try {
    const { query, data, apiKey } = await request.json();

    console.log('=== Custom Query Debug ===');
    console.log('User query:', query);
    console.log('Input data length:', Array.isArray(data) ? data.length : 'not array');
    console.log('Input data sample:', JSON.stringify(data?.slice?.(0, 2) || data, null, 2));

    if (!query || !data || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: query, data, or apiKey' },
        { status: 400 }
      );
    }

    // Generate JSONata query using GPT-4 mini
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const dataSchema = inferDataSchema(data);
    
    const systemPrompt = `You are a JSONata expert. Convert natural language queries to JSONata expressions for SQL-like operations on JSON arrays.

Rules:
1. Return ONLY the JSONata expression, no explanations or markdown, no wrapping in quotes or code blocks or triple backticks.
2. The input data is a JSON array
3. Use proper JSONata syntax based on official documentation
4. Handle edge cases gracefully

Data schema: ` + dataSchema + `

JSONata Reference Guide:

Data Types: JSONata supports JSON types: string ("text"), number (123, 3.14, hex 0x1A etc.), boolean (true/false), null, object ({"key":value}), and array ([val1, val2, …]). (Functions are also first-class but usually invoked via $func().)

Path Expressions: Use dot and bracket syntax to access data.
- Field access: object.field. If a field name has spaces or symbols, use backticks, e.g. obj.\`field name\` or obj.Other.Misc.
- Root/context: $ refers to the current context value; $ refers to the root of the input.
- Arrays: arr selects the whole array. arr[n] (zero-based) selects index n; negative indexes count from end (e.g. arr[-1] is last element). If no brackets are used, path steps map over all elements. For example, Phones.number returns an array of all number fields in Phones. If the bracket contains a non-integer or expression, it is treated as a filter predicate.

Filtering (Predicates): array[<cond>] keeps items where <cond> is true. Inside the brackets, each item becomes the context. For example, Books[price > 10] filters books with price >10. Combine filters like [type='mobile' and available=true].

Ensuring arrays: Adding empty brackets [] after an expression forces the result to be an array (even if a single value). E.g. Book[].title always returns an array of titles.

Wildcards: * selects all fields of an object (returns an array of values). For example, Address.* might yield ["Hursley Park","Winchester","SO21 2JN"]. The deep wildcard ** traverses all descendants. E.g. **.Postcode finds all Postcode values at any depth.

Parentheses: Use () to group expressions or override operator precedence. For example, (Books.authors)[0] selects the first author overall, whereas Books.authors[0] selects each book's first author.

Literals: Strings use double quotes ("text"). Booleans true, false, and null are unquoted. Numeric literals can be integers or decimals; also hex (0x), octal (0o), binary (0b).

Operators:
- Arithmetic: +, -, *, /, % (modulo). Unary - for negation.
- Range: .. inside array constructor to generate sequences. E.g. [1..5] → [1,2,3,4,5].
- String Concatenation: & joins strings. E.g. "Hello" & " " & "World" → "Hello World". (Non-strings are cast via $string().)
- Comparison: =, != for equality (deep-equals for arrays/objects); <, >, <=, >= for numeric/string ordering. Example: "a" < "b", 5 >= 3.
- Inclusion: x in y returns true if x is found in array y (or if y is a single value, it's treated as a one-element array). Example: "apple" in ["banana","apple"].
- Boolean: and, or (both operands cast to boolean if needed). No infix not; use $not(expr) or comparison a!=b.
- Conditional: cond ? expr1 : expr2 (ternary). E.g. price<50 ? "Cheap" : "Expensive". cond is first cast to Boolean.

Variables: Use := to bind: e.g. $x := 5. Variables start with $ (e.g. $item, $count). $ (with no name) is the current context value.

Function Chain: ~> chains output into functions. E.g. value ~> $substringBefore(".") ~> $uppercase() is like $uppercase($substringBefore(value,".")).

Built-in Functions:
- String: $string(x), $length(s), $substring(s,start[,len]), $substringBefore(s,sep), $substringAfter(s,sep), $uppercase(s), $lowercase(s), $trim(s), $match(s,/regex/), $replace(s, /regex/, repl).
- Numeric: $number(x), $abs(n), $floor(n), $ceil(n), $round(n[,prec]), $power(x,y), $sqrt(n), $sum(array), $max(array), $min(array), $average(array).
- Boolean: $boolean(x), $not(x), $exists(x) (true if x is not empty).
- Array: $count(array) (length), $append(a,b) (concatenate), $sort(array[,comparator]), $reverse(array), $distinct(array) (unique), $zip(a,b,...) (transpose).
- Higher-order: $map(array, function), $filter(array,function), $reduce(array,function[,init]), $single(array,function) (exactly one match), $sift(object,function).
- Object: $keys(obj) (array of keys), $lookup(obj,key) (value by key), $spread(obj) (split into array of single-key objects), $merge(arrayOfObjects), $each(obj,function) (apply to each key/value), $type(x) (string name of type).
- Date/Time: $now() (current timestamp as ISO string), $millis() (current epoch ms), $fromMillis(ms, picture?) (format date), $toMillis(timestamp, picture?).
- Aggregation: $sum(array), $max(array), $min(array), $average(array) (mean).

Examples:
- Basic access: person.name → returns the name field.
- Nested fields: order.customer.address.city.
- Array indexing: items[0] returns first item; items[-1] returns last.
- Filtering: Books[price>20] (all books with price > 20).
- Filter + project: Books[category="fiction"].title yields array of titles of fiction books.
- Mapping: Orders.Amount.(Currency & amount) applies inner expression to each order.
- Sum: $sum(Orders.price) adds up all price values in Orders.
- Conditional: stock > 10 ? "plenty" : "low".
- String ops: $uppercase(name) or name & "!".
- Ensure array: Customer[].id always returns an array of ids, even if one customer.
- Wildcard: Address.* gets all values in Address; **.postcode finds all postal codes.`;

    console.log('=== FULL PROMPT SENT TO LLM ===');
    console.log('SYSTEM PROMPT:');
    console.log(systemPrompt);
    console.log('\nUSER MESSAGE:');
    console.log(query);
    console.log('=== END PROMPT ===');

    const completion = await openai.chat.completions.create({
		model: "anthropic/claude-sonnet-4",
		messages: [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: query },
		],
		temperature: 0.1,
	});

    const jsonataQuery = completion.choices[0]?.message?.content?.trim();
    
    console.log('Generated JSONata query:', jsonataQuery);
    
    if (!jsonataQuery) {
      return NextResponse.json(
        { error: 'Failed to generate JSONata query' },
        { status: 500 }
      );
    }

    // Execute JSONata query
    try {
      console.log('About to execute JSONata query...');
      console.log('Data being passed to JSONata:', JSON.stringify(data, null, 2));
      console.log('Data type:', typeof data);
      console.log('Data is array:', Array.isArray(data));
      
      // Validate JSONata syntax before execution
      let expression;
      try {
        expression = jsonata(jsonataQuery);
        console.log('Expression created successfully');
      } catch (parseError) {
        console.error('JSONata parse error:', parseError);
        return NextResponse.json(
          { error: `Invalid JSONata syntax: ${jsonataQuery}. Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}` },
          { status: 400 }
        );
      }
      
      const result = await expression.evaluate(data);
      console.log('Expression evaluated successfully');
      
      console.log('JSONata result:', JSON.stringify(result, null, 2));
      console.log('Result type:', typeof result);
      console.log('Result is array:', Array.isArray(result));
      console.log('Result length:', Array.isArray(result) ? result.length : 'not array');
      
      return NextResponse.json({ 
        data: result,
        query: jsonataQuery 
      });
    } catch (jsonataError) {
      console.error('JSONata execution error:', jsonataError);
      console.error('Error details:', {
        name: jsonataError instanceof Error ? jsonataError.name : 'Unknown',
        message: jsonataError instanceof Error ? jsonataError.message : 'Unknown error',
        stack: jsonataError instanceof Error ? jsonataError.stack : 'No stack'
      });
      console.log('Failed query was:', jsonataQuery);
      return NextResponse.json(
        { error: `Failed to execute JSONata query: ${jsonataQuery}. Error: ${jsonataError instanceof Error ? jsonataError.message : 'Unknown error'}` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('API route error:', error);
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message || 'OpenRouter API request failed' },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function inferDataSchema(data: unknown[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return 'Empty array';
  }

  const sample = data[0];
  if (typeof sample === 'string') {
    return 'Array of strings';
  }
  
  if (typeof sample === 'object' && sample !== null) {
    // Show up to 3 sample objects with collapsed long text
    const samplesToShow = Math.min(3, data.length);
    const examples = data.slice(0, samplesToShow).map((item, index) => {
      const collapsed = collapseObject(item as Record<string, unknown>);
      return `Example ${index + 1}: ${JSON.stringify(collapsed)}`;
    }).join('\n');
    
    const keys = Object.keys(sample);
    const schema = keys.map(key => {
      const value = (sample as Record<string, unknown>)[key];
      const type = Array.isArray(value) ? 'array' : typeof value;
      return `${key}: ${type}`;
    }).join(', ');
    
    return `Array of objects with fields: {${schema}}

Sample data:
${examples}`;
  }
  
  return `Array of ${typeof sample}`;
}

function collapseObject(obj: Record<string, unknown>): Record<string, unknown> {
  const collapsed: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.length > 50) {
      // Collapse long strings
      collapsed[key] = value.substring(0, 50) + '...';
    } else if (Array.isArray(value)) {
      // Show array length and first few items
      if (value.length > 3) {
        collapsed[key] = [...value.slice(0, 3), `... (${value.length - 3} more)`];
      } else {
        collapsed[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively collapse nested objects
      collapsed[key] = collapseObject(value as Record<string, unknown>);
    } else {
      collapsed[key] = value;
    }
  }
  
  return collapsed;
}
