--  RUN 1st
create extension vector;

-- RUN 2nd
create table pdf (
  id bigserial primary key,
  content text,
  content_length bigint,
  content_tokens bigint,
  page_num bigint,
  embedding vector (768)
);

-- RUN 3rd after running the scripts
create or replace function pdf_search (
  query_embedding vector(768),
  similarity_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  content_length bigint,
  content_tokens bigint,
  page_num bigint,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    pdf.id,
    pdf.content,
    pdf.content_length,
    pdf.content_tokens,
    pdf.page_num,
    1 - (pdf.embedding <=> query_embedding) as similarity
  from pdf
  where 1 - (pdf.embedding <=> query_embedding) > similarity_threshold
  order by pdf.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RUN 4th
create index on pdf 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);