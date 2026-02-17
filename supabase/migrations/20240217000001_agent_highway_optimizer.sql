-- Migración de Autonomía del Agente - Misión #2 Optimizer
-- Creando el experimento de optimización para Miami

INSERT INTO public.highway_experiments (
    name, 
    description, 
    is_active, 
    config, 
    updated_at
) VALUES 
(
    'miami_vibe_boost_v1', 
    'Aumenta el peso de la categoría Party/Event en Miami (Beach Clubs) para captar tráfico early-stage y convertirlo después.', 
    true, 
    '{
        "party_weight": 1.5,
        "adult_weight": 0.8,
        "regions": ["miami-us", "miami-beach"],
        "target_audience": "cold_to_warm"
    }'::jsonb, 
    NOW()
)
ON CONFLICT (name) DO UPDATE SET
    config = EXCLUDED.config,
    is_active = true,
    updated_at = NOW();
