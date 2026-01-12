const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CURATION_DATA = [
    {
        ids: ['e71cea0f-e5b5-48b3-9fb5-467710ff1be7', '9480a8df-dd4b-4a0e-aebd-5df51d1eba9c'],
        data: {
            title: 'Mandala Puerto Vallarta',
            description: 'El epicentro de la fiesta en el Malecón. Energía vibrante, vistas al mar y la mejor selección de música house del momento.',
            category: 'Nightclub',
            keywords: ['Open-air', 'Ocean View', 'Party', 'House Music']
        }
    },
    {
        ids: ['3d257209-a85f-49b7-b6c3-6d1e939d7ce5', 'afa2567b-340d-4d0d-81d2-da16ba85ae90'],
        data: {
            title: 'La Vaquita',
            description: 'La icónica vaca te espera. Diversión sin límites, ambiente desinhibido y los mejores litros del Malecón.',
            category: 'Nightclub',
            keywords: ['Fun', 'Shots', 'Casual', 'Malecón']
        }
    },
    {
        ids: ['3cb6b65f-d3a4-43e4-8313-44c404151262', 'ab0f430f-c888-4247-8820-639ac9c5d51c'],
        data: {
            title: 'La Santa',
            description: 'Lujo y beats electrónicos. El spot más exclusivo de la Zona Hotelera para quienes buscan diseño, elegancia y sofisticación.',
            category: 'Nightclub',
            keywords: ['Exclusive', 'Techhouse', 'Luxury', 'VIP']
        }
    },
    {
        ids: ['e0f1283b-dfa0-43c2-9889-3a9327d356d4', '20c52609-9c09-442b-a29d-30d65dc4aca5'],
        data: {
            title: 'Strana',
            description: 'Tecnología medieval y elegancia. Una experiencia audiovisual única con DJs internacionales de primer nivel en un ambiente chic.',
            category: 'Nightclub',
            keywords: ['Electronic', 'Fancy', 'Architecture', 'International DJs']
        }
    },
    {
        ids: ['4b65b6f1-0459-4fc2-8626-968c32258caa', '56f563b1-26df-45f8-a7b5-81fb0ad712df'],
        data: {
            title: 'Mr. Flamingo',
            description: 'El corazón de la Zona Romántica. Ritmos latinos, colores neón y el ambiente más alegre y diverso de Vallarta.',
            category: 'Bar',
            keywords: ['Latin Rhythms', 'LGBTQ+', 'Vibrant', 'Cocktails']
        }
    },
    {
        ids: ['5872cf08-4d5a-4e5d-9134-eb81fb99deec', '1ffcce39-dec4-4c96-94e3-b0b7dc56725a'],
        data: {
            title: 'La Noche',
            description: 'Cultura drag y coctelería premium en tres niveles. Disfruta de una noche vibrante y sofisticada bajo las estrellas.',
            category: 'Bar',
            keywords: ['Drag Shows', 'Rooftop', 'Pride', 'Premium Drinks']
        }
    },
    {
        ids: ['25578c9c-8fa6-437b-acc9-5899f5e795eb', '5bd7f69c-7240-442d-9c31-a3c1257041dc'],
        data: {
            title: 'Colibri',
            description: 'Un speakeasy tropical escondido en el Centro. Coctelería de autor y una atmósfera íntima perfecta para noches místicas.',
            category: 'Bar',
            keywords: ['Speakeasy', 'Mixology', 'Tropical', 'Chill']
        }
    },
    {
        ids: ['27102f76-5b91-4089-b21a-a08b996c801f', '6aad67f8-912a-47b6-9c5c-b9313ca70955'],
        data: {
            title: 'La Bodeguita del Medio',
            description: 'Sabor cubano auténtico. Mojitos legendarios, salsa en vivo y la esencia de La Habana frente al Malecón.',
            category: 'Bar',
            keywords: ['Cuban', 'Salsa', 'Mojitos', 'Live Music']
        }
    },
    {
        ids: ['af76301a-81ef-42e2-82ea-8dd1a30ec4b9', 'e8193c5e-4643-41aa-9b19-acb3760936f9'],
        data: {
            title: 'The Top Sky Bar',
            description: 'Vistas infinitas a la Bahía de Banderas. El rooftop más sofisticado para disfrutar de un atardecer de lujo con buena música.',
            category: 'Bar',
            keywords: ['Rooftop', 'Sunset', 'Luxury', 'View']
        }
    },
    {
        ids: ['c80b668d-56ee-4537-886f-31ec1107cc49', 'f482fd14-62b3-4602-aab8-d08d4591c6eb'],
        data: {
            title: 'El Dorado',
            description: 'Glamour a la orilla del mar. Jazz en vivo, gastronomía de mar y la mejor vibra de playa en el corazón de Los Muertos.',
            category: 'Beach Club',
            keywords: ['Beach', 'Jazz', 'Sea Food', 'Romantic']
        }
    },
    {
        ids: ['cc4ffcd1-ce45-4d1f-9067-936a7e5d10de'], // Cinema Fest
        data: {
            title: 'Festival Internacional de Cine PV',
            description: 'Disfruta de la magia del cine en Puerto Vallarta. Proyecciones internacionales y alfombra roja frente al mar.',
            category: 'Evento',
            keywords: ['Cinema', 'Culture', 'Festival', 'Puerto Vallarta']
        }
    },
    {
        ids: ['a420f205-e9a2-4cca-b6e5-06401554c4cd'], // Volleyball
        data: {
            title: 'Mexico Open Volleyball',
            description: 'Deporte y adrenalina en la playa. No te pierdas el campeonato nacional de voley en la icónica Playa Holi.',
            category: 'Evento',
            keywords: ['Sports', 'Beach', 'Volleyball', 'Fun']
        }
    },
    {
        ids: ['fa0e29c1-7abc-4e00-abdd-2efe15e5b7f0'], // Taco Fair
        data: {
            title: 'Feria del Taco Vallarta',
            description: 'El paraíso del taco. Ven a degustar las mejores creaciones locales en la feria gastronómica más sabrosa del año.',
            category: 'Evento',
            keywords: ['Tacos', 'Food', 'Gastronomy', 'Local']
        }
    }
];

async function applyCuration() {
    console.log('✨ Iniciando Aplicación de Curación Manual...');

    for (const group of CURATION_DATA) {
        for (const id of group.ids) {
            console.log(`📝 Actualizando item ${id}: ${group.data.title}...`);
            const { error } = await supabase
                .from('content')
                .update({
                    ...group.data,
                    metadata: { curated_by_ai: true, manual_intervention: true }
                })
                .eq('id', id);

            if (error) console.error(`❌ Error al actualizar ${id}:`, error.message);
        }
    }

    console.log('✅ Curación manual completada.');
}

applyCuration();
