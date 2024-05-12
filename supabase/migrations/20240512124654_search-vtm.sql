CREATE TABLE IF NOT EXISTS vtm_v5 (
    id SERIAL PRIMARY KEY,
    embedding_v1 vector(1024),
    content TEXT,
    type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'UTC')
);


DROP FUNCTION IF EXISTS public.search_vtm;

CREATE OR REPLACE FUNCTION public.search_vtm(query_vector double precision[],  top_k integer)
 RETURNS TABLE(id integer, doc_content text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT vtm_v5.id, vtm_v5.content
    FROM public.vtm_v5
    ORDER BY vtm_v5.embedding_v1 <=> query_vector::vector
    LIMIT top_k;
END;
$function$