// Sourced verbatim (Spanish) from echamelo.com.mx/legal/terminos.html and
// /legal/privacidad.html, with an English translation for bilingual display.

export type LegalSection = { heading: string; body: string[] };
export type LegalDoc = {
  title: string;
  version: string;
  updated: string;
  intro: string[];
  callout?: string;
  sections: LegalSection[];
};

export const termsEs: LegalDoc = {
  title: "Términos de Uso",
  version: "Versión 1.0",
  updated: "Última actualización: 30 de junio de 2026",
  intro: [
    "¡ECHAMELO! TÉRMINOS DE USO. Bienvenido a ¡ECHAMELO! Por favor revisa estos Términos de Uso (los \"Términos\"), nuestra Política de Privacidad (disponible en esta misma sección) y cualquier otra política publicada dentro de la aplicación, ya que rigen tu uso del sitio ubicado en echamelo.com.mx y la plataforma correspondiente (en conjunto, la \"App\"), operada por ¡ECHAMELO! (\"nosotros\", \"nuestro\" o nuestra \"Plataforma\").",
    "Estos Términos aplican a usuarios que residen en México y, en general, a cualquier persona que acceda a la App desde cualquier ubicación, sujeto a las leyes mexicanas aplicables, incluyendo el Código de Comercio, la Ley Federal de Protección al Consumidor (LFPC) y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
  ],
  callout:
    "Aviso importante. ¡ECHAMELO! es una plataforma tecnológica que conecta a vendedores independientes con compradores mediante subastas y transmisiones en vivo. No somos propietarios de los artículos publicados ni parte del contrato de compraventa entre comprador y vendedor, salvo en lo expresamente indicado en estos Términos.",
  sections: [
    {
      heading: "Qué es ¡ECHAMELO!",
      body: [
        "La App es un mercado en línea que conecta a usuarios de la App (\"Usuarios\"). Si ofreces en venta artículos (\"Artículos\") a través de transmisiones en vivo o catálogo, eres un \"Vendedor\". Si compras Artículos o realizas un pago a un Vendedor a través de la App, eres un \"Comprador\". Las transacciones entre Vendedor y Comprador a través de la App se denominan \"Transacciones\".",
        "¡ECHAMELO! ofrece una plataforma que facilita Transacciones entre Compradores y Vendedores, pero no es parte del acuerdo de compraventa entre ellos. Salvo lo expresamente previsto en estos Términos, ¡ECHAMELO! no vende ni compra Artículos por cuenta propia, ni toma posesión de los mismos. Los Vendedores son los únicos responsables de la legalidad, calidad, descripción y garantías aplicables a sus Artículos.",
        "¡ECHAMELO! procesa pagos a través de proveedores externos de procesamiento de pagos (\"Procesadores de Pago\"), actualmente Stripe. Compradores y Vendedores deben cumplir con los términos y condiciones propios de dichos Procesadores de Pago.",
        "Debido a que nuestra App evoluciona constantemente, podemos modificar o discontinuar cualquier parte de ella en cualquier momento y a nuestra entera discreción, notificando los cambios relevantes dentro de la propia App.",
      ],
    },
    {
      heading: "Aceptación de los Términos",
      body: [
        "Al usar la App aceptas y te obligas a cumplir estos Términos y nuestra Política de Privacidad, los cuales se incorporan aquí por referencia. Si no estás de acuerdo, no debes acceder ni usar la App. Si accedes a la App en nombre de una empresa u otra entidad legal, declaras que cuentas con autoridad para vincular a dicha entidad a estos Términos.",
        "Podemos actualizar estos Términos en cualquier momento. Te notificaremos publicando la versión actualizada dentro de la App. El uso continuado de ¡ECHAMELO! después de publicado un cambio implica tu aceptación del mismo.",
      ],
    },
    {
      heading: "Elegibilidad y creación de cuenta",
      body: [
        "Debes tener al menos 18 años cumplidos para crear una cuenta (\"Cuenta\") en la App. Al crear una Cuenta declaras y garantizas que cumples este requisito de edad y los demás requisitos de elegibilidad aquí descritos. Si no cumples estos requisitos, no debes crear una Cuenta ni continuar usando una Cuenta existente.",
        "Eres responsable de mantener segura tu contraseña y de toda actividad realizada desde tu Cuenta, autorizada o no. Debes proporcionarnos información veraz, completa y actualizada al registrarte y mantenerla así. Notifícanos de inmediato ante cualquier uso no autorizado de tu Cuenta.",
        "Podemos suspender o desactivar tu Cuenta a nuestra discreción si incumples estos Términos. Una Cuenta desactivada no podrá iniciar sesión hasta que un administrador la reactive.",
      ],
    },
    {
      heading: "Métodos de pago y autorización",
      body: [
        "Debes proporcionar un método de pago vigente antes de realizar cualquier Transacción (\"Método de Pago\"). Al iniciar una Transacción, nos autorizas a compartir tu información de pago con nuestro Procesador de Pago para completar la Transacción y a realizar el cargo correspondiente, incluyendo impuestos y cargos aplicables. Eres el único responsable de mantener tu Método de Pago vigente y de la veracidad de la información proporcionada.",
        "Todos los pagos por Transacciones son no reembolsables y no transferibles, salvo lo expresamente previsto en estos Términos o lo que exija la legislación mexicana aplicable, incluyendo la LFPC.",
      ],
    },
    {
      heading: "Pagos en custodia y liberación de fondos",
      body: [
        "Los pagos realizados por Compradores se procesan a través de la cuenta de Stripe operada por ¡ECHAMELO! y se retienen en custodia interna hasta que la venta es revisada y aprobada por un administrador de la Plataforma. Una vez aprobada la venta, el monto correspondiente al Vendedor —descontando la comisión de plataforma aplicable— queda disponible como saldo retirable dentro de su perfil.",
        "Los retiros de saldo se procesan mediante transferencia electrónica interbancaria (SPEI) a la cuenta CLABE que el Vendedor haya registrado en su perfil. ¡ECHAMELO! no es responsable de retrasos o errores derivados de información bancaria incorrecta proporcionada por el Vendedor.",
      ],
    },
    {
      heading: "Comisiones",
      body: [
        "¡ECHAMELO! cobra una comisión sobre cada venta concretada a través de la Plataforma, la cual se detalla dentro del panel de Vendedor en la sección \"Términos del Vendedor\". Podemos ajustar las comisiones en cualquier momento; los cambios aplicarán únicamente a ventas futuras, no a saldos ya generados antes del cambio.",
      ],
    },
    {
      heading: "Subastas en vivo",
      body: [
        "Los Vendedores pueden realizar subastas en vivo bajo dos modalidades: \"Muerte Súbita\" (con temporizador fijo que reinicia con cada nueva puja) y \"Continua\" (donde cada puja suma tiempo adicional hasta un máximo establecido). Las pujas realizadas durante una subasta son vinculantes: si resultas ganador de una subasta, te comprometes a pagar el monto ofertado.",
        "El Vendedor actúa como subastador y determina las reglas específicas de cada subasta (precio de salida, incrementos, condiciones de envío), sujeto a estos Términos. Nos reservamos el derecho de cancelar una Transacción si determinamos, a nuestra discreción razonable, que una puja se realizó por error o de forma fraudulenta.",
      ],
    },
    {
      heading: "Bots de subasta (simulación)",
      body: [
        "Algunos Vendedores pueden activar, dentro de su panel, bots automatizados que participan en el chat de la transmisión y que, en ausencia de pujas reales por un periodo determinado, generan pujas simuladas con el fin de dinamizar la subasta. Estas pujas de bots dejan de generarse en los últimos segundos antes del cierre de la subasta para no interferir con pujas reales.",
        "Si un bot resulta \"ganador\" de una puja, no se genera ninguna venta real, cargo a ningún Comprador, ni movimiento de saldo para el Vendedor o para ¡ECHAMELO!. Se trata únicamente de una simulación visual destinada a dar dinamismo a la transmisión, y así se hace constar para efectos de transparencia con los Usuarios.",
      ],
    },
    {
      heading: "Transmisiones en vivo y contenido",
      body: [
        "Los Vendedores son responsables del contenido que transmiten durante sus transmisiones en vivo, incluyendo imagen, audio, productos mostrados y mensajes de chat. Está prohibido transmitir contenido ilegal, fraudulento, difamatorio, que infrinja derechos de propiedad intelectual de terceros, o que de cualquier forma viole la legislación mexicana aplicable. Podemos suspender o terminar una transmisión que incumpla estas reglas sin previo aviso.",
        "Al transmitir contenido en vivo a través de la App, otorgas a ¡ECHAMELO! una licencia no exclusiva, gratuita y mundial para almacenar y mostrar dicho contenido dentro de la Plataforma, exclusivamente con el fin de operar el servicio (por ejemplo, para verificación de transacciones y prevención de fraude).",
      ],
    },
    {
      heading: "Envíos y entregas",
      body: [
        "Los costos y condiciones de envío son determinados por cada Vendedor al momento de la venta y se muestran al Comprador antes de confirmar el pago. El Vendedor es responsable de despachar el Artículo conforme a lo acordado y de proporcionar información de rastreo cuando esté disponible. Las disputas relacionadas con retrasos, pérdidas o daños durante el envío se resolverán entre Comprador y Vendedor; ¡ECHAMELO! podrá mediar de buena fe pero no garantiza el resultado de dicha mediación.",
      ],
    },
    {
      heading: "Devoluciones y disputas",
      body: [
        "Las políticas de devolución son definidas por cada Vendedor, sin perjuicio de los derechos irrenunciables que la Ley Federal de Protección al Consumidor reconoce a los Compradores en territorio mexicano. Ante cualquier disputa entre Comprador y Vendedor, podrás contactarnos mediante la sección \"Contáctanos\" dentro de la App o al correo indicado al final de este documento; mediaremos de buena fe entre ambas partes, sin que esto constituya una obligación de resultado.",
      ],
    },
    {
      heading: "Conducta prohibida",
      body: [
        "Al usar la App te obligas a no, ni ayudar a un tercero a: (i) publicar contenido que infrinja derechos de propiedad intelectual, sea fraudulento, difamatorio, obsceno o discriminatorio; (ii) vender Artículos robados o ilegalmente obtenidos; (iii) suplantar la identidad de otra persona o entidad; (iv) manipular subastas de forma fraudulenta o coludida; (v) usar la Plataforma con fines de lavado de dinero u otras actividades ilícitas conforme a la legislación mexicana; (vi) intentar vulnerar la seguridad del sistema, realizar ingeniería inversa o uso automatizado no autorizado de la App; o (vii) acosar, intimidar o dañar a otros Usuarios.",
        "Nos reservamos el derecho de investigar incumplimientos, retirar contenido, suspender Cuentas y cooperar con autoridades competentes cuando la ley así lo requiera.",
      ],
    },
    {
      heading: "Cumplimiento legal e interacciones entre Usuarios",
      body: [
        "Cada Usuario es responsable de determinar y cumplir las leyes aplicables a su actividad en la Plataforma, incluyendo regulaciones específicas sobre la venta de ciertos productos (por ejemplo, alimentos, productos médicos, bebidas alcohólicas o artículos regulados). ¡ECHAMELO! no garantiza que la App o las Transacciones realizadas a través de ella cumplan en todo momento con dichas regulaciones, siendo responsabilidad del Usuario verificarlo.",
        "Cualquier disputa que surja entre Usuarios deberá resolverse entre ellos; ¡ECHAMELO! no es responsable de interacciones fuera de la Plataforma ni garantiza la veracidad de la información proporcionada por otros Usuarios.",
      ],
    },
    {
      heading: "Terminación",
      body: [
        "Podemos suspender o terminar tu acceso a la App, incluyendo la suspensión de tu Cuenta, en cualquier momento y a nuestra discreción, particularmente ante incumplimientos a estos Términos. Puedes eliminar tu Cuenta en cualquier momento desde la App. Las secciones relativas a pagos pendientes, propiedad intelectual, limitación de responsabilidad y ley aplicable sobrevivirán a la terminación de tu Cuenta.",
      ],
    },
    {
      heading: "Exclusión de garantías",
      body: [
        "En la máxima medida permitida por la legislación mexicana aplicable, la App y cualquier contenido o información en ella, incluyendo el contenido generado por Usuarios, se proporcionan \"tal cual\", sin garantía de ningún tipo. No garantizamos que la App esté libre de interrupciones, errores o sea completamente segura. Esta exclusión no afecta los derechos irrenunciables que la Ley Federal de Protección al Consumidor reconoce a los consumidores en México.",
      ],
    },
    {
      heading: "Limitación de responsabilidad",
      body: [
        "En la máxima medida permitida por la ley, ¡ECHAMELO! no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso de la App. Salvo lo expresamente previsto en estos Términos, ¡ECHAMELO! no compra ni vende Artículos y no es parte del contrato de compraventa entre Comprador y Vendedor; cualquier daño o reclamación derivada de una Transacción será responsabilidad exclusiva de las partes involucradas en ella.",
        "Nada en esta sección limita los derechos irrenunciables que correspondan a los consumidores conforme a la Ley Federal de Protección al Consumidor u otra legislación mexicana de orden público aplicable.",
      ],
    },
    {
      heading: "Indemnización",
      body: [
        "Aceptas defender, indemnizar y mantener libre de responsabilidad a ¡ECHAMELO! frente a cualquier reclamación, demanda o procedimiento derivado de: (a) tu acceso o uso de la App, incluyendo cualquier Transacción en la que participes; (b) disputas con otros Usuarios; (c) tu incumplimiento de estos Términos; o (d) tu violación de derechos de terceros.",
      ],
    },
    {
      heading: "Ley aplicable y jurisdicción",
      body: [
        "Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia derivada de estos Términos que no pueda resolverse de manera amistosa, las partes se someten a la jurisdicción de los tribunales competentes de la Ciudad de México, renunciando expresamente a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.",
      ],
    },
    {
      heading: "Disposiciones generales",
      body: [
        "Reserva de derechos. ¡ECHAMELO! y sus licenciantes son los únicos propietarios de todo derecho, título e interés sobre la App, incluyendo los derechos de propiedad intelectual asociados.",
        "Acuerdo completo. Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre ¡ECHAMELO! y tú respecto al uso de la App, y sustituyen cualquier entendimiento previo entre las partes.",
        "Notificaciones. Cualquier aviso bajo estos Términos se realizará por correo electrónico o mediante publicación dentro de la App.",
        "Comunicaciones electrónicas. Aceptas recibir comunicaciones de ¡ECHAMELO! de forma electrónica al correo registrado en tu Cuenta, y reconoces que dichas comunicaciones satisfacen cualquier requisito legal de comunicación por escrito.",
      ],
    },
    {
      heading: "Contacto",
      body: ["¿Dudas sobre estos Términos? Usa el botón \"Contáctanos\" desde la pantalla de inicio de la App."],
    },
  ],
};

export const termsEn: LegalDoc = {
  title: "Terms of Use",
  version: "Version 1.0",
  updated: "Last updated: June 30, 2026",
  intro: [
    "¡ECHAMELO! TERMS OF USE. Welcome to ¡ECHAMELO! Please review these Terms of Use (the \"Terms\"), our Privacy Policy (available in this same section), and any other policy published within the application, as they govern your use of the site at echamelo.com.mx and the corresponding platform (together, the \"App\"), operated by ¡ECHAMELO! (\"we,\" \"our,\" or our \"Platform\").",
    "These Terms apply to users residing in Mexico and, generally, to anyone accessing the App from any location, subject to applicable Mexican law, including the Commercial Code, the Federal Consumer Protection Law (LFPC), and the Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP).",
  ],
  callout:
    "Important notice. ¡ECHAMELO! is a technology platform that connects independent sellers with buyers through auctions and live streams. We do not own the items listed nor are we a party to the sale contract between buyer and seller, except as expressly stated in these Terms.",
  sections: [
    {
      heading: "What ¡ECHAMELO! is",
      body: [
        "The App is an online marketplace connecting App users (\"Users\"). If you offer items (\"Items\") for sale through live streams or a catalog, you are a \"Seller.\" If you purchase Items or make a payment to a Seller through the App, you are a \"Buyer.\" Transactions between a Seller and a Buyer through the App are called \"Transactions.\"",
        "¡ECHAMELO! provides a platform that facilitates Transactions between Buyers and Sellers but is not a party to the sale agreement between them. Except as expressly provided in these Terms, ¡ECHAMELO! does not sell or buy Items on its own account, nor does it take possession of them. Sellers are solely responsible for the legality, quality, description, and warranties applicable to their Items.",
        "¡ECHAMELO! processes payments through third-party payment processors (\"Payment Processors\"), currently Stripe. Buyers and Sellers must comply with the terms and conditions of those Payment Processors.",
        "Because our App is constantly evolving, we may modify or discontinue any part of it at any time and at our sole discretion, notifying relevant changes within the App itself.",
      ],
    },
    {
      heading: "Acceptance of the Terms",
      body: [
        "By using the App you accept and agree to comply with these Terms and our Privacy Policy, which are incorporated here by reference. If you do not agree, you must not access or use the App. If you access the App on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these Terms.",
        "We may update these Terms at any time. We will notify you by posting the updated version within the App. Continued use of ¡ECHAMELO! after a change is posted constitutes your acceptance of it.",
      ],
    },
    {
      heading: "Eligibility and account creation",
      body: [
        "You must be at least 18 years old to create an account (\"Account\") on the App. By creating an Account, you represent and warrant that you meet this age requirement and the other eligibility requirements described here. If you do not meet these requirements, you must not create an Account or continue using an existing one.",
        "You are responsible for keeping your password secure and for all activity carried out from your Account, whether authorized or not. You must provide truthful, complete, and up-to-date information when registering and keep it that way. Notify us immediately of any unauthorized use of your Account.",
        "We may suspend or deactivate your Account at our discretion if you breach these Terms. A deactivated Account cannot log in until an administrator reactivates it.",
      ],
    },
    {
      heading: "Payment methods and authorization",
      body: [
        "You must provide a valid payment method before making any Transaction (\"Payment Method\"). By initiating a Transaction, you authorize us to share your payment information with our Payment Processor to complete the Transaction and to charge the corresponding amount, including applicable taxes and fees. You are solely responsible for keeping your Payment Method valid and for the accuracy of the information provided.",
        "All payments for Transactions are non-refundable and non-transferable, except as expressly provided in these Terms or as required by applicable Mexican law, including the LFPC.",
      ],
    },
    {
      heading: "Escrow payments and release of funds",
      body: [
        "Payments made by Buyers are processed through the Stripe account operated by ¡ECHAMELO! and held in internal escrow until the sale is reviewed and approved by a Platform administrator. Once the sale is approved, the amount owed to the Seller — after deducting the applicable platform commission — becomes available as a withdrawable balance within their profile.",
        "Balance withdrawals are processed via interbank electronic transfer (SPEI) to the CLABE account the Seller has registered on their profile. ¡ECHAMELO! is not responsible for delays or errors resulting from incorrect banking information provided by the Seller.",
      ],
    },
    {
      heading: "Commissions",
      body: [
        "¡ECHAMELO! charges a commission on each sale completed through the Platform, detailed within the Seller panel under \"Seller Terms.\" We may adjust commissions at any time; changes will apply only to future sales, not to balances already generated before the change.",
      ],
    },
    {
      heading: "Live auctions",
      body: [
        "Sellers may run live auctions under two formats: \"Sudden Death\" (a fixed timer that resets with each new bid) and \"Continuous\" (where each bid adds additional time up to a set maximum). Bids placed during an auction are binding: if you win an auction, you commit to paying the bid amount.",
        "The Seller acts as auctioneer and determines the specific rules of each auction (starting price, increments, shipping conditions), subject to these Terms. We reserve the right to cancel a Transaction if we determine, at our reasonable discretion, that a bid was placed in error or fraudulently.",
      ],
    },
    {
      heading: "Auction bots (simulation)",
      body: [
        "Some Sellers may enable, within their panel, automated bots that participate in the stream chat and, in the absence of real bids for a set period, generate simulated bids to keep the auction dynamic. These bot bids stop generating in the final seconds before the auction closes so they don't interfere with real bids.",
        "If a bot \"wins\" a bid, no actual sale, charge to any Buyer, or balance movement is generated for the Seller or for ¡ECHAMELO!. This is purely a visual simulation intended to add energy to the stream, and is disclosed here for transparency with Users.",
      ],
    },
    {
      heading: "Live streams and content",
      body: [
        "Sellers are responsible for the content they broadcast during their live streams, including video, audio, products shown, and chat messages. It is prohibited to stream illegal, fraudulent, or defamatory content, content that infringes third-party intellectual property rights, or that otherwise violates applicable Mexican law. We may suspend or terminate a stream that breaches these rules without prior notice.",
        "By streaming live content through the App, you grant ¡ECHAMELO! a non-exclusive, royalty-free, worldwide license to store and display that content within the Platform, solely for the purpose of operating the service (for example, for transaction verification and fraud prevention).",
      ],
    },
    {
      heading: "Shipping and delivery",
      body: [
        "Shipping costs and conditions are determined by each Seller at the time of sale and shown to the Buyer before payment is confirmed. The Seller is responsible for dispatching the Item as agreed and for providing tracking information when available. Disputes related to delays, loss, or damage during shipping will be resolved between Buyer and Seller; ¡ECHAMELO! may mediate in good faith but does not guarantee the outcome of such mediation.",
      ],
    },
    {
      heading: "Returns and disputes",
      body: [
        "Return policies are defined by each Seller, without prejudice to the non-waivable rights the Federal Consumer Protection Law grants to Buyers in Mexican territory. For any dispute between Buyer and Seller, you may contact us through the \"Contact Us\" section within the App or the email listed at the end of this document; we will mediate in good faith between both parties, without this constituting an obligation of result.",
      ],
    },
    {
      heading: "Prohibited conduct",
      body: [
        "By using the App you agree not to, and not to help a third party to: (i) post content that infringes intellectual property rights, or is fraudulent, defamatory, obscene, or discriminatory; (ii) sell stolen or illegally obtained Items; (iii) impersonate another person or entity; (iv) manipulate auctions fraudulently or through collusion; (v) use the Platform for money laundering or other illegal activities under Mexican law; (vi) attempt to breach system security, reverse-engineer, or make unauthorized automated use of the App; or (vii) harass, intimidate, or harm other Users.",
        "We reserve the right to investigate breaches, remove content, suspend Accounts, and cooperate with competent authorities when required by law.",
      ],
    },
    {
      heading: "Legal compliance and interactions between Users",
      body: [
        "Each User is responsible for determining and complying with the laws applicable to their activity on the Platform, including specific regulations on the sale of certain products (for example, food, medical products, alcoholic beverages, or regulated items). ¡ECHAMELO! does not guarantee that the App or Transactions made through it comply at all times with such regulations; it is the User's responsibility to verify this.",
        "Any dispute arising between Users must be resolved between them; ¡ECHAMELO! is not responsible for interactions outside the Platform nor does it guarantee the accuracy of information provided by other Users.",
      ],
    },
    {
      heading: "Termination",
      body: [
        "We may suspend or terminate your access to the App, including suspending your Account, at any time and at our discretion, particularly for breaches of these Terms. You may delete your Account at any time from the App. Sections relating to pending payments, intellectual property, limitation of liability, and governing law will survive termination of your Account.",
      ],
    },
    {
      heading: "Disclaimer of warranties",
      body: [
        "To the maximum extent permitted by applicable Mexican law, the App and any content or information in it, including User-generated content, are provided \"as is,\" without warranty of any kind. We do not guarantee the App will be free of interruptions or errors, or that it is completely secure. This disclaimer does not affect the non-waivable rights the Federal Consumer Protection Law grants to consumers in Mexico.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the maximum extent permitted by law, ¡ECHAMELO! will not be liable for indirect, incidental, special, or consequential damages arising from use of the App. Except as expressly provided in these Terms, ¡ECHAMELO! does not buy or sell Items and is not a party to the sale contract between Buyer and Seller; any damage or claim arising from a Transaction is the sole responsibility of the parties involved in it.",
        "Nothing in this section limits the non-waivable rights consumers have under the Federal Consumer Protection Law or other applicable Mexican public-order legislation.",
      ],
    },
    {
      heading: "Indemnification",
      body: [
        "You agree to defend, indemnify, and hold ¡ECHAMELO! harmless from any claim, demand, or proceeding arising from: (a) your access to or use of the App, including any Transaction you participate in; (b) disputes with other Users; (c) your breach of these Terms; or (d) your violation of third-party rights.",
      ],
    },
    {
      heading: "Governing law and jurisdiction",
      body: [
        "These Terms are governed by the laws of the United Mexican States. For any dispute arising from these Terms that cannot be resolved amicably, the parties submit to the jurisdiction of the competent courts of Mexico City, expressly waiving any other venue that might correspond to them by reason of their present or future domicile.",
      ],
    },
    {
      heading: "General provisions",
      body: [
        "Reservation of rights. ¡ECHAMELO! and its licensors are the sole owners of all right, title, and interest in the App, including the associated intellectual property rights.",
        "Entire agreement. These Terms, together with the Privacy Policy, constitute the entire agreement between ¡ECHAMELO! and you regarding use of the App, and supersede any prior understanding between the parties.",
        "Notices. Any notice under these Terms will be given by email or by posting within the App.",
        "Electronic communications. You agree to receive communications from ¡ECHAMELO! electronically at the email registered on your Account, and acknowledge that such communications satisfy any legal requirement for written communication.",
      ],
    },
    {
      heading: "Contact",
      body: ["Questions about these Terms? Use the \"Contact Us\" button from the App's home screen."],
    },
  ],
};

export const privacyEs: LegalDoc = {
  title: "Política de Privacidad",
  version: "Versión 1.0",
  updated: "Última actualización: 30 de junio de 2026",
  intro: [
    "Esta Política de Privacidad explica qué datos personales recopila ¡ECHAMELO! (echamelo.com.mx), para qué los usamos, con quién los compartimos y cuáles son tus derechos conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento. Aplica a Compradores, Vendedores y visitantes de la App.",
    "Responsable del tratamiento. ¡ECHAMELO! es responsable del tratamiento de tus datos personales conforme a esta Política. Puedes contactarnos para cualquier solicitud relacionada con tus datos a través del correo indicado al final de este documento.",
  ],
  sections: [
    {
      heading: "Datos que recopilamos",
      body: [
        "Dependiendo de tu rol dentro de la App, podemos recopilar las siguientes categorías de datos personales: datos de identificación (nombre, apellido, nombre de usuario, fotografía de perfil y portada); datos de contacto (correo electrónico, teléfono, dirección de envío, ciudad, estado, código postal); datos de pago de Compradores (información de tarjeta, procesada y almacenada de forma segura por Stripe; ¡ECHAMELO! nunca almacena el número completo de tu tarjeta); datos bancarios de Vendedores (CLABE interbancaria, institución bancaria y nombre del titular, usados exclusivamente para procesar retiros vía SPEI); contenido generado (mensajes enviados en el chat de transmisiones en vivo, productos publicados, video y audio transmitido durante un live); y datos técnicos (dirección IP, tipo de dispositivo y datos de sesión, usados para seguridad y prevención de fraude).",
      ],
    },
    {
      heading: "Finalidades del tratamiento",
      body: [
        "Usamos tus datos personales para las siguientes finalidades primarias, necesarias para la relación que tienes con nosotros: crear, verificar y administrar tu Cuenta dentro de la App; procesar pagos realizados como Comprador y retiros solicitados como Vendedor; permitirte participar en subastas, transmisiones en vivo y el chat asociado; enviarte notificaciones sobre el estado de tus compras, ventas, retiros o tu Cuenta; y prevenir fraude, suplantación de identidad y uso indebido de la Plataforma.",
        "De forma secundaria, y siempre que no te opongas, podemos usar tus datos para mejorar la App con base en patrones de uso agregados. Puedes oponerte a este uso secundario en cualquier momento escribiéndonos al correo de contacto.",
      ],
    },
    {
      heading: "Con quién compartimos tu información",
      body: [
        "Compartimos datos personales únicamente con los proveedores estrictamente necesarios para operar el servicio, bajo acuerdos de confidencialidad y protección de datos: Stripe (procesamiento de pagos con tarjeta y dispersión de retiros), LiveKit (infraestructura de transmisión de video y audio en vivo), y Pusher (mensajería en tiempo real para chat y actualizaciones de subasta).",
        "No vendemos, rentamos ni compartimos tus datos personales con terceros para fines publicitarios o de mercadotecnia ajenos a ¡ECHAMELO!. Podremos compartir información con autoridades competentes cuando exista un requerimiento legal válido conforme a la legislación mexicana.",
      ],
    },
    {
      heading: "Qué ve el Vendedor de un Comprador (y viceversa)",
      body: [
        "Cuando ganas una subasta o realizas una compra, el Vendedor correspondiente recibe únicamente los datos necesarios para procesar y enviar tu pedido: nombre, dirección de envío y teléfono. Tu información de pago y datos bancarios nunca se comparten con el Vendedor; este solo visualiza el monto de la venta y el estado del envío.",
        "De forma análoga, los Compradores no tienen acceso a los datos bancarios (CLABE) del Vendedor; únicamente ven la información pública de su perfil (nombre de canal, categoría, foto y portada).",
      ],
    },
    {
      heading: "Almacenamiento y medidas de seguridad",
      body: [
        "Tu información se almacena en nuestros servidores y se transmite de forma cifrada. Las contraseñas se resguardan mediante funciones de hash criptográfico (bcrypt) y nunca se almacenan en texto plano. La información relevante de tu Cuenta —incluyendo saldos, historial de ventas y configuración de perfil— reside en nuestros servidores, no en el almacenamiento local de tu navegador, de modo que tu Cuenta se vea y funcione igual sin importar el dispositivo desde el cual inicies sesión.",
        "Implementamos medidas administrativas, técnicas y físicas razonables para proteger tus datos personales contra daño, pérdida, alteración, destrucción o uso, acceso o tratamiento no autorizado, conforme a lo exigido por la LFPDPPP.",
      ],
    },
    {
      heading: "Chat y transmisiones en vivo",
      body: [
        "Los mensajes que envíes en el chat de una transmisión en vivo son visibles para los demás espectadores de esa transmisión mientras está activa. Algunos Vendedores pueden activar mensajes automatizados (\"bots\") dentro de su panel para dinamizar el chat de su transmisión; estos bots no representan personas reales, no recopilan tus datos personales y no interactúan con tu información de ninguna forma.",
      ],
    },
    {
      heading: "Tus derechos ARCO",
      body: [
        "Conforme a la LFPDPPP, tienes derecho a Acceder, Rectificar, Cancelar u Oponerte (derechos \"ARCO\") al tratamiento de tus datos personales, así como a revocar el consentimiento que en su caso hayas otorgado. Para ejercer cualquiera de estos derechos, escríbenos al correo indicado al final de este documento, incluyendo: tu nombre completo y nombre de usuario dentro de la App; una descripción clara del derecho que deseas ejercer; y cualquier documento que sustente tu solicitud, en su caso.",
        "Responderemos a tu solicitud dentro de los plazos establecidos por la LFPDPPP. Si eliminas tu Cuenta, conservaremos únicamente la información necesaria para cumplir obligaciones legales, fiscales o contables relacionadas con ventas ya realizadas.",
      ],
    },
    {
      heading: "Menores de edad",
      body: [
        "¡ECHAMELO! no está dirigido a menores de 18 años y no recopilamos intencionalmente datos personales de menores. Si tenemos conocimiento de que una Cuenta pertenece a un menor de edad, procederemos a desactivarla.",
      ],
    },
    {
      heading: "Transferencias de datos",
      body: [
        "Algunos de nuestros proveedores de servicios (Stripe, LiveKit, Pusher) pueden procesar datos fuera del territorio mexicano. En estos casos, nos aseguramos de que dichos proveedores cuenten con medidas de protección de datos equivalentes a las exigidas por la legislación mexicana, conforme lo permite la LFPDPPP para transferencias necesarias para la ejecución de la relación jurídica entre tú y ¡ECHAMELO!.",
      ],
    },
    {
      heading: "Cambios a esta Política",
      body: [
        "Podemos actualizar esta Política de Privacidad para reflejar cambios en nuestras prácticas de tratamiento de datos o en la legislación aplicable. Te notificaremos dentro de la App cuando se realicen cambios relevantes, y la fecha de \"Última actualización\" en la parte superior de este documento reflejará la versión vigente.",
      ],
    },
    {
      heading: "Contacto",
      body: [
        "Para ejercer tus derechos ARCO o resolver cualquier duda sobre el tratamiento de tus datos personales, usa el botón \"Contáctanos\" desde la pantalla de inicio de la App.",
      ],
    },
  ],
};

export const privacyEn: LegalDoc = {
  title: "Privacy Policy",
  version: "Version 1.0",
  updated: "Last updated: June 30, 2026",
  intro: [
    "This Privacy Policy explains what personal data ¡ECHAMELO! (echamelo.com.mx) collects, what we use it for, who we share it with, and what your rights are under the Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP) and its Regulations. It applies to Buyers, Sellers, and visitors of the App.",
    "Data controller. ¡ECHAMELO! is responsible for processing your personal data under this Policy. You can contact us for any data-related request via the email listed at the end of this document.",
  ],
  sections: [
    {
      heading: "Data we collect",
      body: [
        "Depending on your role within the App, we may collect the following categories of personal data: identification data (first name, last name, username, profile photo and cover photo); contact data (email, phone, shipping address, city, state, postal code); Buyer payment data (card information, securely processed and stored by Stripe; ¡ECHAMELO! never stores your full card number); Seller banking data (CLABE bank account number, banking institution, and account holder name, used exclusively to process SPEI withdrawals); generated content (messages sent in live stream chat, listed products, video and audio streamed during a live broadcast); and technical data (IP address, device type, and session data, used for security and fraud prevention).",
      ],
    },
    {
      heading: "Purposes of processing",
      body: [
        "We use your personal data for the following primary purposes, necessary for our relationship with you: creating, verifying, and managing your Account within the App; processing payments made as a Buyer and withdrawals requested as a Seller; enabling you to participate in auctions, live streams, and the associated chat; sending you notifications about the status of your purchases, sales, withdrawals, or your Account; and preventing fraud, identity theft, and misuse of the Platform.",
        "Secondarily, and as long as you do not object, we may use your data to improve the App based on aggregated usage patterns. You may object to this secondary use at any time by writing to our contact email.",
      ],
    },
    {
      heading: "Who we share your information with",
      body: [
        "We share personal data only with the providers strictly necessary to operate the service, under confidentiality and data-protection agreements: Stripe (card payment processing and withdrawal disbursement), LiveKit (live video and audio streaming infrastructure), and Pusher (real-time messaging for chat and auction updates).",
        "We do not sell, rent, or share your personal data with third parties for advertising or marketing purposes unrelated to ¡ECHAMELO!. We may share information with competent authorities when there is a valid legal requirement under Mexican law.",
      ],
    },
    {
      heading: "What a Seller sees about a Buyer (and vice versa)",
      body: [
        "When you win an auction or make a purchase, the corresponding Seller receives only the data necessary to process and ship your order: name, shipping address, and phone number. Your payment information and banking data are never shared with the Seller; they only see the sale amount and shipping status.",
        "Similarly, Buyers do not have access to a Seller's banking data (CLABE); they only see the public information on their profile (channel name, category, photo, and cover).",
      ],
    },
    {
      heading: "Storage and security measures",
      body: [
        "Your information is stored on our servers and transmitted encrypted. Passwords are protected using cryptographic hash functions (bcrypt) and are never stored in plain text. Relevant Account information — including balances, sales history, and profile settings — resides on our servers, not in your browser's local storage, so your Account looks and works the same regardless of the device you log in from.",
        "We implement reasonable administrative, technical, and physical measures to protect your personal data against damage, loss, alteration, destruction, or unauthorized use, access, or processing, as required by the LFPDPPP.",
      ],
    },
    {
      heading: "Chat and live streams",
      body: [
        "Messages you send in a live stream's chat are visible to other viewers of that stream while it is active. Some Sellers may enable automated messages (\"bots\") within their panel to keep their stream's chat lively; these bots do not represent real people, do not collect your personal data, and do not interact with your information in any way.",
      ],
    },
    {
      heading: "Your ARCO rights",
      body: [
        "Under the LFPDPPP, you have the right to Access, Rectify, Cancel, or Object (\"ARCO\" rights) to the processing of your personal data, as well as to revoke any consent you may have given. To exercise any of these rights, write to us at the email listed at the end of this document, including: your full name and username within the App; a clear description of the right you wish to exercise; and any supporting documentation, if applicable.",
        "We will respond to your request within the time frames established by the LFPDPPP. If you delete your Account, we will retain only the information necessary to comply with legal, tax, or accounting obligations related to sales already completed.",
      ],
    },
    {
      heading: "Minors",
      body: [
        "¡ECHAMELO! is not directed at minors under 18 and we do not knowingly collect personal data from minors. If we become aware that an Account belongs to a minor, we will deactivate it.",
      ],
    },
    {
      heading: "Data transfers",
      body: [
        "Some of our service providers (Stripe, LiveKit, Pusher) may process data outside Mexican territory. In these cases, we ensure such providers maintain data-protection measures equivalent to those required by Mexican law, as permitted by the LFPDPPP for transfers necessary to carry out the legal relationship between you and ¡ECHAMELO!.",
      ],
    },
    {
      heading: "Changes to this Policy",
      body: [
        "We may update this Privacy Policy to reflect changes in our data-processing practices or applicable law. We will notify you within the App when relevant changes are made, and the \"Last updated\" date at the top of this document will reflect the current version.",
      ],
    },
    {
      heading: "Contact",
      body: [
        "To exercise your ARCO rights or resolve any questions about the processing of your personal data, use the \"Contact Us\" button from the App's home screen.",
      ],
    },
  ],
};
