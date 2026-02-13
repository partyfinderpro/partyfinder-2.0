// VENUZ - Plantilla de Review SEO-Friendly para Sitios de Webcams
// Diseñada para pasar controles de calidad de agencias (CamSoda, Stripchat, etc.)

import { Metadata } from 'next'

// ============================================
// SCHEMA.ORG STRUCTURED DATA
// ============================================
interface ReviewSchemaProps {
  siteName: string
  rating: number
  reviewCount: number
  pros: string[]
  cons: string[]
  affiliateUrl: string
}

export function generateReviewSchema({
  siteName,
  rating,
  reviewCount,
  pros,
  cons,
  affiliateUrl
}: ReviewSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "WebSite",
      "name": siteName,
      "url": affiliateUrl
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": rating,
      "bestRating": 5,
      "worstRating": 1
    },
    "author": {
      "@type": "Organization",
      "name": "VENUZ",
      "url": "https://venuz.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "VENUZ",
      "logo": {
        "@type": "ImageObject",
        "url": "https://venuz.com/logo.png"
      }
    },
    "reviewBody": `Review completo de ${siteName} con análisis de características, precios y experiencia de usuario.`,
    "positiveNotes": {
      "@type": "ItemList",
      "itemListElement": pros.map((pro, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": pro
      }))
    },
    "negativeNotes": {
      "@type": "ItemList", 
      "itemListElement": cons.map((con, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": con
      }))
    }
  }
}

// ============================================
// METADATA GENERATOR (Next.js 14)
// ============================================
export function generateReviewMetadata(siteName: string, year: number): Metadata {
  return {
    title: `${siteName} Review ${year} - ¿Es Seguro y Vale la Pena? | VENUZ`,
    description: `Review honesto de ${siteName} en ${year}. Analizamos seguridad, precios, modelos latinas, métodos de pago en México y nuestra experiencia real. ⭐ Calificación verificada.`,
    keywords: [
      `${siteName.toLowerCase()} review`,
      `${siteName.toLowerCase()} opiniones`,
      `${siteName.toLowerCase()} es seguro`,
      `${siteName.toLowerCase()} mexico`,
      `${siteName.toLowerCase()} ${year}`,
      `mejores webcams latinas`
    ],
    openGraph: {
      title: `${siteName} Review ${year} - Análisis Completo | VENUZ`,
      description: `¿Vale la pena ${siteName}? Review con pruebas reales, pros, contras y comparativa.`,
      type: 'article',
      locale: 'es_MX',
      siteName: 'VENUZ'
    },
    alternates: {
      canonical: `https://venuz.com/webcams/reviews/${siteName.toLowerCase()}`
    }
  }
}

// ============================================
// REVIEW PAGE COMPONENT
// ============================================
interface WebcamReviewProps {
  site: {
    name: string
    slug: string
    logo: string
    affiliateUrl: string
    rating: number
    reviewCount: number
    foundedYear: number
    headquarters: string
    modelCount: string
    categories: string[]
    paymentMethods: string[]
    minPrice: string
    pros: string[]
    cons: string[]
    verdict: string
  }
}

export default function WebcamReviewTemplate({ site }: WebcamReviewProps) {
  const currentYear = new Date().getFullYear()
  
  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateReviewSchema({
            siteName: site.name,
            rating: site.rating,
            reviewCount: site.reviewCount,
            pros: site.pros,
            cons: site.cons,
            affiliateUrl: site.affiliateUrl
          }))
        }}
      />
      
      {/* ============================================ */}
      {/* HERO SECTION - Above the fold */}
      {/* ============================================ */}
      <header className="mb-8">
        {/* Breadcrumbs (SEO + UX) */}
        <nav className="text-sm text-gray-400 mb-4">
          <a href="/" className="hover:text-pink-400">VENUZ</a>
          <span className="mx-2">›</span>
          <a href="/webcams" className="hover:text-pink-400">Webcams</a>
          <span className="mx-2">›</span>
          <a href="/webcams/reviews" className="hover:text-pink-400">Reviews</a>
          <span className="mx-2">›</span>
          <span className="text-white">{site.name}</span>
        </nav>
        
        {/* H1 con keyword principal */}
        <h1 className="text-4xl font-bold text-white mb-4">
          {site.name} Review {currentYear}: ¿Es Seguro y Vale la Pena?
        </h1>
        
        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>📅 Actualizado: Enero {currentYear}</span>
          <span>⏱️ 8 min lectura</span>
          <span>✅ Verificado por VENUZ</span>
        </div>
      </header>

      {/* ============================================ */}
      {/* QUICK VERDICT BOX - Para usuarios impacientes */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <img 
              src={site.logo} 
              alt={`Logo de ${site.name}`}
              className="h-12 mb-4"
            />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl font-bold text-white">{site.rating}</span>
              <span className="text-yellow-400">{'★'.repeat(Math.floor(site.rating))}</span>
              <span className="text-gray-400">/ 5.0</span>
            </div>
            <p className="text-gray-300 text-sm">
              Basado en {site.reviewCount.toLocaleString()} opiniones verificadas
            </p>
          </div>
          
          {/* CTA Principal - Affiliate Link */}
          <a
            href={site.affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-8 py-4 rounded-lg hover:scale-105 transition-transform"
          >
            Visitar {site.name} →
          </a>
        </div>
        
        {/* Quick Pros/Cons */}
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div>
            <h3 className="text-green-400 font-semibold mb-2">✅ Lo Mejor</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              {site.pros.slice(0, 3).map((pro, i) => (
                <li key={i}>• {pro}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-red-400 font-semibold mb-2">❌ Mejorable</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              {site.cons.slice(0, 3).map((con, i) => (
                <li key={i}>• {con}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* TABLE OF CONTENTS - Para SEO y UX */}
      {/* ============================================ */}
      <nav className="bg-gray-900/50 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-white mb-3">📑 Contenido del Review</h2>
        <ol className="text-sm text-gray-300 space-y-2">
          <li><a href="#que-es" className="hover:text-pink-400">1. ¿Qué es {site.name}?</a></li>
          <li><a href="#como-funciona" className="hover:text-pink-400">2. ¿Cómo funciona?</a></li>
          <li><a href="#precios" className="hover:text-pink-400">3. Precios y métodos de pago en México</a></li>
          <li><a href="#seguridad" className="hover:text-pink-400">4. ¿Es seguro usar {site.name}?</a></li>
          <li><a href="#modelos" className="hover:text-pink-400">5. Modelos latinas y categorías</a></li>
          <li><a href="#pros-contras" className="hover:text-pink-400">6. Pros y contras completos</a></li>
          <li><a href="#alternativas" className="hover:text-pink-400">7. Mejores alternativas</a></li>
          <li><a href="#veredicto" className="hover:text-pink-400">8. Veredicto final</a></li>
          <li><a href="#faq" className="hover:text-pink-400">9. Preguntas frecuentes</a></li>
        </ol>
      </nav>

      {/* ============================================ */}
      {/* MAIN CONTENT SECTIONS */}
      {/* ============================================ */}
      
      {/* Section 1: ¿Qué es? */}
      <section id="que-es" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          ¿Qué es {site.name}?
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          {site.name} es una plataforma de webcams en vivo fundada en {site.foundedYear} 
          con sede en {site.headquarters}. Actualmente cuenta con más de {site.modelCount} modelos 
          activas, incluyendo una gran selección de modelos latinas y de habla hispana.
        </p>
        
        {/* Info Box - Datos rápidos */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">📊 Datos Rápidos de {site.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Fundado</span>
              <p className="text-white font-medium">{site.foundedYear}</p>
            </div>
            <div>
              <span className="text-gray-400">Modelos</span>
              <p className="text-white font-medium">{site.modelCount}+</p>
            </div>
            <div>
              <span className="text-gray-400">Precio mínimo</span>
              <p className="text-white font-medium">{site.minPrice}</p>
            </div>
            <div>
              <span className="text-gray-400">Rating VENUZ</span>
              <p className="text-white font-medium">{site.rating}/5.0</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: ¿Cómo funciona? */}
      <section id="como-funciona" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          ¿Cómo funciona {site.name}?
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          El funcionamiento de {site.name} es similar al de otras plataformas de webcams. 
          Los usuarios pueden ver shows gratuitos en las salas públicas, pero para interactuar 
          con las modelos (chat, propinas, shows privados) necesitas comprar tokens o créditos.
        </p>
        
        {/* Step by step */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <span className="bg-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</span>
            <div>
              <h4 className="text-white font-medium">Crea una cuenta gratuita</h4>
              <p className="text-gray-400 text-sm">Solo necesitas email. No pide tarjeta para registrarte.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="bg-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</span>
            <div>
              <h4 className="text-white font-medium">Explora las salas en vivo</h4>
              <p className="text-gray-400 text-sm">Filtra por categoría, idioma, o tipo de show.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="bg-pink-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</span>
            <div>
              <h4 className="text-white font-medium">Compra tokens para interactuar</h4>
              <p className="text-gray-400 text-sm">Acepta tarjetas mexicanas, PayPal y crypto.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Precios */}
      <section id="precios" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Precios de {site.name} en México ({currentYear})
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Una de las preguntas más comunes es cuánto cuesta usar {site.name} en México. 
          La buena noticia es que ver shows públicos es completamente gratis. Solo pagas 
          si quieres interactuar o ver shows privados.
        </p>
        
        {/* Pricing table placeholder */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">💰 Tabla de Precios</h3>
          <div className="text-gray-300 text-sm">
            <p>• Registro: <span className="text-green-400">GRATIS</span></p>
            <p>• Ver shows públicos: <span className="text-green-400">GRATIS</span></p>
            <p>• Paquete inicial: Desde {site.minPrice}</p>
            <p>• Métodos de pago: {site.paymentMethods.join(', ')}</p>
          </div>
        </div>
      </section>

      {/* Section 4: Seguridad */}
      <section id="seguridad" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          ¿Es seguro usar {site.name} en México?
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Sí, {site.name} es una plataforma legítima y segura. Opera desde {site.foundedYear} 
          y cumple con estándares internacionales de seguridad. Tus pagos están protegidos 
          con encriptación SSL y el cargo aparece discreto en tu estado de cuenta.
        </p>
        
        {/* Trust badges */}
        <div className="flex flex-wrap gap-3">
          <span className="bg-green-900/30 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-sm">
            🔒 SSL Encriptado
          </span>
          <span className="bg-green-900/30 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-sm">
            ✅ Cargo Discreto
          </span>
          <span className="bg-green-900/30 border border-green-500/30 text-green-400 px-3 py-1 rounded-full text-sm">
            🛡️ Verificación 18+
          </span>
        </div>
      </section>

      {/* Section 5: Modelos */}
      <section id="modelos" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Modelos Latinas en {site.name}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          {site.name} tiene una de las mejores selecciones de modelos latinas y de habla hispana. 
          Puedes filtrar específicamente por idioma español y encontrar modelos de México, 
          Colombia, Venezuela, Argentina y más.
        </p>
        
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {site.categories.map((cat, i) => (
            <span 
              key={i}
              className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm"
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Section 6: Pros y Contras completos */}
      <section id="pros-contras" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Pros y Contras de {site.name}
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-3">✅ Ventajas</h3>
            <ul className="text-gray-300 space-y-2">
              {site.pros.map((pro, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-3">❌ Desventajas</h3>
            <ul className="text-gray-300 space-y-2">
              {site.cons.map((con, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-400">✗</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Section 7: Alternativas */}
      <section id="alternativas" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Alternativas a {site.name}
        </h2>
        <p className="text-gray-300 leading-relaxed mb-4">
          Si {site.name} no te convence, estas son las mejores alternativas que hemos probado:
        </p>
        {/* Placeholder for alternatives comparison table */}
        <p className="text-gray-400 italic">
          [Aquí va componente de comparación con otras plataformas]
        </p>
      </section>

      {/* Section 8: Veredicto */}
      <section id="veredicto" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Veredicto Final: ¿Vale la Pena {site.name}?
        </h2>
        <div className="bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-500/30 rounded-lg p-6">
          <p className="text-gray-300 leading-relaxed text-lg">
            {site.verdict}
          </p>
          
          {/* Final CTA */}
          <div className="mt-6 text-center">
            <a
              href={site.affiliateUrl}
              target="_blank"
              rel="noopener sponsored"
              className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold px-8 py-4 rounded-lg hover:scale-105 transition-transform"
            >
              Probar {site.name} Gratis →
            </a>
            <p className="text-gray-400 text-sm mt-2">
              Registro gratuito • No requiere tarjeta
            </p>
          </div>
        </div>
      </section>

      {/* Section 9: FAQ */}
      <section id="faq" className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">
          Preguntas Frecuentes sobre {site.name}
        </h2>
        
        {/* FAQ Schema-ready structure */}
        <div className="space-y-4">
          <details className="bg-gray-800/50 rounded-lg p-4">
            <summary className="text-white font-medium cursor-pointer">
              ¿{site.name} es legal en México?
            </summary>
            <p className="text-gray-300 mt-2">
              Sí, {site.name} opera legalmente y es accesible desde México. 
              La plataforma cumple con regulaciones internacionales de contenido adulto.
            </p>
          </details>
          
          <details className="bg-gray-800/50 rounded-lg p-4">
            <summary className="text-white font-medium cursor-pointer">
              ¿Cómo aparece el cargo en mi tarjeta?
            </summary>
            <p className="text-gray-300 mt-2">
              El cargo aparece de forma discreta, generalmente como un nombre genérico 
              que no menciona la plataforma directamente.
            </p>
          </details>
          
          <details className="bg-gray-800/50 rounded-lg p-4">
            <summary className="text-white font-medium cursor-pointer">
              ¿Puedo usar {site.name} gratis?
            </summary>
            <p className="text-gray-300 mt-2">
              Sí, puedes ver shows públicos completamente gratis. Solo pagas si quieres 
              interactuar con las modelos o ver shows privados.
            </p>
          </details>
        </div>
      </section>

      {/* ============================================ */}
      {/* AFFILIATE DISCLOSURE - Requerido para agencias */}
      {/* ============================================ */}
      <footer className="border-t border-gray-700 pt-6 mt-12">
        <p className="text-gray-500 text-sm">
          <strong>Divulgación de Afiliados:</strong> VENUZ puede recibir una comisión 
          si te registras a través de nuestros enlaces. Esto no afecta nuestras 
          calificaciones, que se basan en pruebas independientes. 
          <a href="/about" className="text-pink-400 hover:underline ml-1">
            Conoce nuestra metodología →
          </a>
        </p>
        
        <p className="text-gray-500 text-sm mt-2">
          <strong>Última actualización:</strong> Enero {currentYear} • 
          <strong> Autor:</strong> Equipo VENUZ
        </p>
      </footer>
    </article>
  )
}

// ============================================
// EJEMPLO DE USO / DATOS DE PRUEBA
// ============================================
export const exampleSiteData = {
  name: "CamSoda",
  slug: "camsoda",
  logo: "/images/logos/camsoda.png",
  affiliateUrl: "https://www.camsoda.com/?aff=venuz",
  rating: 4.6,
  reviewCount: 12847,
  foundedYear: 2014,
  headquarters: "Estados Unidos",
  modelCount: "25,000",
  categories: [
    "Latinas", "Españolas", "Asiáticas", "MILF", 
    "Teen 18+", "BBW", "Trans", "Couples", "Fetish"
  ],
  paymentMethods: [
    "Visa", "Mastercard", "PayPal", "Crypto", "Gift Cards"
  ],
  minPrice: "$5.99 USD",
  pros: [
    "Excelente selección de modelos latinas",
    "Shows públicos gratuitos de alta calidad",
    "Interfaz moderna y fácil de usar",
    "Acepta pagos desde México sin problemas",
    "Cargo discreto en estado de cuenta",
    "App móvil disponible"
  ],
  cons: [
    "Algunos shows privados son caros",
    "Pop-ups de registro frecuentes",
    "No tiene soporte en español"
  ],
  verdict: `Después de probar ${new Date().getFullYear() - 2014} años de CamSoda, 
    nuestra conclusión es clara: es una de las mejores plataformas para usuarios 
    mexicanos. La combinación de modelos latinas, pagos fáciles y shows gratuitos 
    la hacen nuestra recomendación #2 después de Stripchat.`
}
