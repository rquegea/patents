const mockPatents = [
  {
    lens_id: "185-929-378-112-459",
    jurisdiction: "US",
    doc_number: "US20240112345",
    kind: "A1",
    date_published: "2024-06-15",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Method for purification of sepiolite clay minerals using selective flocculation", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Tolsa S.A." } }],
        inventors: [
          { extracted_name: { value: "Garcia Martinez, Juan" } },
          { extracted_name: { value: "Lopez Rodriguez, Maria" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B01D21/01" }
        ]
      }
    },
    abstract: [{ text: "A method for purifying sepiolite clay minerals involving selective flocculation techniques to separate impurities from the fibrous mineral structure, resulting in high-purity sepiolite suitable for industrial applications including rheological additives and absorbents.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 3 } }
  },
  {
    lens_id: "042-837-291-556-783",
    jurisdiction: "EP",
    doc_number: "EP4123456",
    kind: "A1",
    date_published: "2024-03-20",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Enhanced sepiolite purification process with acid treatment and thermal activation", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "BASF SE" } }],
        inventors: [
          { extracted_name: { value: "Mueller, Hans" } },
          { extracted_name: { value: "Schmidt, Anna" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "C04B33/04" }
        ]
      }
    },
    abstract: [{ text: "An enhanced process for the purification of natural sepiolite through a combination of controlled acid leaching and thermal activation steps. The process removes carbonate and iron oxide impurities while preserving the fibrous microstructure of sepiolite.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 5 } }
  },
  {
    lens_id: "129-445-667-890-234",
    jurisdiction: "CN",
    doc_number: "CN115678901",
    kind: "A",
    date_published: "2023-11-10",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [
        { text: "一种海泡石提纯方法", lang: "zh" },
        { text: "A sepiolite purification method using ultrasonic-assisted disaggregation", lang: "en" }
      ],
      parties: {
        applicants: [{ extracted_name: { value: "Hunan University of Science and Technology" } }],
        inventors: [
          { extracted_name: { value: "Wang, Lei" } },
          { extracted_name: { value: "Zhang, Wei" } },
          { extracted_name: { value: "Chen, Xiaoming" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B02C19/18" }
        ]
      }
    },
    abstract: [{ text: "A method for purifying sepiolite minerals using ultrasonic-assisted disaggregation combined with centrifugal classification. The method achieves high purity levels while maintaining the fibrous morphology essential for industrial applications.", lang: "en" }],
    legal_status: { patent_status: "ACTIVE" },
    families: { simple_family: { size: 1 } }
  },
  {
    lens_id: "078-234-556-789-012",
    jurisdiction: "WO",
    doc_number: "WO2024050001",
    kind: "A1",
    date_published: "2024-03-07",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Nano-sepiolite production through controlled purification and defibrillation", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Tolsa S.A." } }, { extracted_name: { value: "Universidad Complutense de Madrid" } }],
        inventors: [
          { extracted_name: { value: "Fernandez Alvarez, Carlos" } },
          { extracted_name: { value: "Ruiz Hitzky, Eduardo" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B82Y30/00" }
        ]
      }
    },
    abstract: [{ text: "A process for producing nano-sepiolite fibers through controlled purification steps followed by mechanical defibrillation. The resulting nanofibers exhibit enhanced surface area and adsorption capacity for use in nanocomposite materials and environmental remediation.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 8 } }
  },
  {
    lens_id: "345-678-901-234-567",
    jurisdiction: "JP",
    doc_number: "JP2023156789",
    kind: "A",
    date_published: "2023-09-22",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Sepiolite purification apparatus with continuous processing capability", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Sumitomo Chemical Co., Ltd." } }],
        inventors: [
          { extracted_name: { value: "Tanaka, Yuki" } },
          { extracted_name: { value: "Nakamura, Kenji" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B01J20/12" }
        ]
      }
    },
    abstract: [{ text: "An apparatus and method for continuous purification of sepiolite clay minerals. The system integrates wet classification, magnetic separation, and controlled drying stages to produce consistent high-purity sepiolite for catalyst support applications.", lang: "en" }],
    legal_status: { patent_status: "ACTIVE" },
    families: { simple_family: { size: 4 } }
  },
  {
    lens_id: "567-890-123-456-789",
    jurisdiction: "US",
    doc_number: "US11234567",
    kind: "B2",
    date_published: "2023-01-31",
    publication_type: "GRANTED_PATENT",
    biblio: {
      invention_title: [{ text: "High-purity sepiolite for pharmaceutical excipient applications", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Minerals Technologies Inc." } }],
        inventors: [
          { extracted_name: { value: "Johnson, Robert K." } },
          { extracted_name: { value: "Williams, Sarah E." } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "A61K47/02" }
        ]
      }
    },
    abstract: [{ text: "A process for producing pharmaceutical-grade sepiolite through multi-stage purification including acid washing, bleaching, and controlled calcination. The resulting material meets USP/NF specifications for use as a pharmaceutical excipient in tablet formulations.", lang: "en" }],
    legal_status: { patent_status: "ACTIVE" },
    families: { simple_family: { size: 6 } }
  },
  {
    lens_id: "890-123-456-789-012",
    jurisdiction: "KR",
    doc_number: "KR20230045678",
    kind: "A",
    date_published: "2023-04-04",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Sepiolite-based nanocomposite preparation via purification and surface modification", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Korea Institute of Geoscience and Mineral Resources" } }],
        inventors: [
          { extracted_name: { value: "Park, Joon-Ho" } },
          { extracted_name: { value: "Kim, Soo-Young" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "C09C1/28" }
        ]
      }
    },
    abstract: [{ text: "A method for preparing sepiolite-based nanocomposites involving initial purification of raw sepiolite ore followed by organosilane surface modification. The modified sepiolite shows improved compatibility with polymer matrices for use in reinforced composites.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 2 } }
  },
  {
    lens_id: "234-567-890-123-456",
    jurisdiction: "ES",
    doc_number: "ES2923456",
    kind: "B1",
    date_published: "2022-09-30",
    publication_type: "GRANTED_PATENT",
    biblio: {
      invention_title: [{ text: "Procedimiento de purificación de sepiolita mediante clasificación hidrociclónica", lang: "es" }, { text: "Sepiolite purification process using hydrocyclone classification", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Tolsa S.A." } }],
        inventors: [
          { extracted_name: { value: "Martinez Gonzalez, Pedro" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B04C5/28" }
        ]
      }
    },
    abstract: [{ text: "A purification process for sepiolite minerals using a series of hydrocyclone stages for particle size classification and impurity removal. The process achieves over 95% purity with minimal fiber damage, suitable for rheological applications in drilling fluids.", lang: "en" }],
    legal_status: { patent_status: "ACTIVE" },
    families: { simple_family: { size: 4 } }
  },
  {
    lens_id: "456-789-012-345-678",
    jurisdiction: "DE",
    doc_number: "DE102022134567",
    kind: "A1",
    date_published: "2024-01-18",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Verfahren zur Reinigung von Sepiolith für katalytische Anwendungen", lang: "de" }, { text: "Method for purification of sepiolite for catalytic applications", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Clariant AG" } }],
        inventors: [
          { extracted_name: { value: "Weber, Thomas" } },
          { extracted_name: { value: "Fischer, Claudia" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B01J21/16" }
        ]
      }
    },
    abstract: [{ text: "A method for purifying sepiolite specifically for use as a catalyst support material. The process involves sequential acid and alkali treatments to create a controlled pore structure while removing metallic impurities that could poison catalytic reactions.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 3 } }
  },
  {
    lens_id: "678-901-234-567-890",
    jurisdiction: "IN",
    doc_number: "IN202311056789",
    kind: "A",
    date_published: "2023-07-14",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Cost-effective sepiolite purification method for water treatment applications", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Indian Institute of Technology Madras" } }],
        inventors: [
          { extracted_name: { value: "Sharma, Priya" } },
          { extracted_name: { value: "Patel, Rajesh" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "C02F1/28" }
        ]
      }
    },
    abstract: [{ text: "A cost-effective method for purifying naturally occurring sepiolite for use in water treatment. The process uses a combination of simple washing, sedimentation, and low-temperature heat treatment to produce sepiolite with adequate purity for heavy metal adsorption from wastewater.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 1 } }
  },
  {
    lens_id: "901-234-567-890-123",
    jurisdiction: "AU",
    doc_number: "AU2023201234",
    kind: "A1",
    date_published: "2023-03-09",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Magnetic separation process for sepiolite purification from mixed clay deposits", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "CSIRO" } }],
        inventors: [
          { extracted_name: { value: "Thompson, James R." } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B03C1/02" }
        ]
      }
    },
    abstract: [{ text: "A magnetic separation process for purifying sepiolite from mixed clay deposits containing paramagnetic impurities. High-gradient magnetic separation is used to selectively remove iron-bearing minerals while retaining the sepiolite fibers.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 2 } }
  },
  {
    lens_id: "123-456-789-012-345",
    jurisdiction: "CA",
    doc_number: "CA3167890",
    kind: "A1",
    date_published: "2023-05-25",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Enzymatic treatment for biological purification of sepiolite minerals", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "University of Toronto" } }],
        inventors: [
          { extracted_name: { value: "Brown, Michael A." } },
          { extracted_name: { value: "Lee, Christine" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "C12P1/00" }
        ]
      }
    },
    abstract: [{ text: "A biological approach to sepiolite purification using enzyme-assisted treatment. Specific enzymes are used to degrade organic contaminants and loosen carbonate impurities adhering to sepiolite fibers, enabling gentler purification conditions.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 3 } }
  },
  {
    lens_id: "012-345-678-901-234",
    jurisdiction: "CN",
    doc_number: "CN116789012",
    kind: "B",
    date_published: "2024-02-06",
    publication_type: "GRANTED_PATENT",
    biblio: {
      invention_title: [{ text: "Microwave-assisted sepiolite purification and activation method", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "China University of Mining and Technology" } }],
        inventors: [
          { extracted_name: { value: "Liu, Feng" } },
          { extracted_name: { value: "Yang, Minghua" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "H05B6/64" }
        ]
      }
    },
    abstract: [{ text: "A microwave-assisted method for the simultaneous purification and activation of natural sepiolite. Microwave irradiation enables rapid and uniform heating, improving impurity removal efficiency and creating an activated sepiolite product with enhanced adsorption capacity.", lang: "en" }],
    legal_status: { patent_status: "ACTIVE" },
    families: { simple_family: { size: 2 } }
  },
  {
    lens_id: "789-012-345-678-901",
    jurisdiction: "US",
    doc_number: "US20220234567",
    kind: "A1",
    date_published: "2022-07-28",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Integrated sepiolite mining and purification system with zero liquid discharge", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Imerys S.A." } }],
        inventors: [
          { extracted_name: { value: "Dupont, Pierre" } },
          { extracted_name: { value: "Martin, Sophie" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "E21C41/26" }
        ]
      }
    },
    abstract: [{ text: "An integrated system for mining and purifying sepiolite that achieves zero liquid discharge. Process water is recycled through membrane filtration, and solid waste is used as backfill material, minimizing environmental impact.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 7 } }
  },
  {
    lens_id: "345-012-789-456-123",
    jurisdiction: "FR",
    doc_number: "FR3123456",
    kind: "A1",
    date_published: "2022-12-02",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Procédé de purification de sépiolite par flottation sélective", lang: "fr" }, { text: "Selective flotation process for sepiolite purification", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Saint-Gobain" } }],
        inventors: [
          { extracted_name: { value: "Bernard, Luc" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B03D1/02" }
        ]
      }
    },
    abstract: [{ text: "A selective flotation process for purifying sepiolite from associated impurities including carbonates and quartz. The process uses novel collector reagents specific to the sepiolite surface chemistry.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 5 } }
  },
  {
    lens_id: "456-123-890-567-234",
    jurisdiction: "GB",
    doc_number: "GB2612345",
    kind: "A",
    date_published: "2023-08-16",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Electrokinetic purification of sepiolite suspensions", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "University of Cambridge" } }],
        inventors: [
          { extracted_name: { value: "Harris, Oliver" } },
          { extracted_name: { value: "Davies, Eleanor" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B01D57/02" }
        ]
      }
    },
    abstract: [{ text: "An electrokinetic method for purifying sepiolite suspensions by exploiting differences in surface charge between sepiolite fibers and impurity particles. The technique enables continuous operation with low energy consumption.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 2 } }
  },
  {
    lens_id: "567-234-901-678-345",
    jurisdiction: "EP",
    doc_number: "EP3987654",
    kind: "B1",
    date_published: "2024-04-10",
    publication_type: "GRANTED_PATENT",
    biblio: {
      invention_title: [{ text: "Purified sepiolite composition for personal care products", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "L'Oréal" } }],
        inventors: [
          { extracted_name: { value: "Moreau, Claire" } },
          { extracted_name: { value: "Petit, Antoine" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "A61K8/26" }
        ]
      }
    },
    abstract: [{ text: "A purified sepiolite composition suitable for personal care products. The purification process removes heavy metals and organic matter to levels safe for dermal application, while maintaining the rheological properties of the sepiolite.", lang: "en" }],
    legal_status: { patent_status: "ACTIVE" },
    families: { simple_family: { size: 9 } }
  },
  {
    lens_id: "678-345-012-789-456",
    jurisdiction: "CN",
    doc_number: "CN117890123",
    kind: "A",
    date_published: "2024-05-03",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Freeze-thaw assisted purification of sepiolite from gangue minerals", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Wuhan University of Technology" } }],
        inventors: [
          { extracted_name: { value: "Sun, Hao" } },
          { extracted_name: { value: "Li, Mei" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "C04B33/04" }
        ]
      }
    },
    abstract: [{ text: "A novel freeze-thaw assisted process for purifying sepiolite from associated gangue minerals. Repeated freeze-thaw cycles mechanically disaggregate the mineral assemblage, facilitating subsequent separation by sedimentation.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 1 } }
  },
  {
    lens_id: "789-456-123-890-567",
    jurisdiction: "US",
    doc_number: "US11567890",
    kind: "B1",
    date_published: "2024-08-20",
    publication_type: "GRANTED_PATENT",
    biblio: {
      invention_title: [{ text: "Supercritical CO2 extraction for sepiolite surface purification", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "3M Company" } }],
        inventors: [
          { extracted_name: { value: "Anderson, David P." } },
          { extracted_name: { value: "Taylor, Jennifer L." } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B01D11/02" }
        ]
      }
    },
    abstract: [{ text: "A method using supercritical carbon dioxide extraction to purify the surface of sepiolite fibers. The process selectively removes organic contaminants and surface-adsorbed species without altering the mineral structure, yielding ultra-pure sepiolite for advanced applications.", lang: "en" }],
    legal_status: { patent_status: "ACTIVE" },
    families: { simple_family: { size: 5 } }
  },
  {
    lens_id: "890-567-234-901-678",
    jurisdiction: "IT",
    doc_number: "IT202200012345",
    kind: "A1",
    date_published: "2022-08-15",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Sepiolite purification by ozone treatment for food-grade applications", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Università di Bologna" } }],
        inventors: [
          { extracted_name: { value: "Rossi, Marco" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "A23L29/04" }
        ]
      }
    },
    abstract: [{ text: "A purification process for sepiolite using ozone treatment to achieve food-grade quality. Ozone oxidation eliminates organic matter and microbial contaminants, producing sepiolite suitable for use as a processing aid in the food industry.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 2 } }
  },
  {
    lens_id: "901-678-345-012-789",
    jurisdiction: "SE",
    doc_number: "SE2300123",
    kind: "A1",
    date_published: "2023-06-20",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Plasma-assisted sepiolite surface purification and functionalization", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "KTH Royal Institute of Technology" } }],
        inventors: [
          { extracted_name: { value: "Eriksson, Lars" } },
          { extracted_name: { value: "Johansson, Karin" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "H05H1/24" }
        ]
      }
    },
    abstract: [{ text: "A plasma-assisted method for simultaneously purifying and functionalizing sepiolite surfaces. Low-temperature atmospheric plasma treatment removes surface contaminants and introduces functional groups for enhanced polymer compatibility.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 1 } }
  },
  {
    lens_id: "012-789-456-123-890",
    jurisdiction: "WO",
    doc_number: "WO2023180001",
    kind: "A2",
    date_published: "2023-09-28",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Continuous centrifugal purification of sepiolite with real-time quality monitoring", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Imerys S.A." } }, { extracted_name: { value: "ETH Zurich" } }],
        inventors: [
          { extracted_name: { value: "Blanc, Francois" } },
          { extracted_name: { value: "Keller, Stefan" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "B04B1/00" },
          { symbol: "G01N21/84" }
        ]
      }
    },
    abstract: [{ text: "A continuous centrifugal system for purifying sepiolite with integrated real-time quality monitoring using near-infrared spectroscopy. The feedback control system adjusts process parameters to maintain consistent product quality.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 6 } }
  },
  {
    lens_id: "123-890-567-234-901",
    jurisdiction: "TR",
    doc_number: "TR202300789",
    kind: "A2",
    date_published: "2023-10-13",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "Low-cost sepiolite purification using natural organic acids", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Eskisehir Osmangazi University" } }],
        inventors: [
          { extracted_name: { value: "Yilmaz, Mehmet" } },
          { extracted_name: { value: "Demir, Ayse" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "C09C1/28" }
        ]
      }
    },
    abstract: [{ text: "A cost-effective sepiolite purification method utilizing natural organic acids (citric acid, oxalic acid) from renewable sources. The method is particularly suited for purifying sepiolite from the large deposits found in the Eskisehir region of Turkey.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 1 } }
  },
  {
    lens_id: "234-901-678-345-012",
    jurisdiction: "US",
    doc_number: "US20250045678",
    kind: "A1",
    date_published: "2025-02-13",
    publication_type: "PATENT_APPLICATION",
    biblio: {
      invention_title: [{ text: "AI-optimized sepiolite purification process control system", lang: "en" }],
      parties: {
        applicants: [{ extracted_name: { value: "Minerals Technologies Inc." } }],
        inventors: [
          { extracted_name: { value: "Davis, Michael" } },
          { extracted_name: { value: "Chen, Li" } }
        ]
      },
      classifications_ipcr: {
        classifications: [
          { symbol: "C01B33/40" },
          { symbol: "G05B13/02" }
        ]
      }
    },
    abstract: [{ text: "A process control system using artificial intelligence to optimize sepiolite purification parameters in real-time. Machine learning models predict optimal acid concentration, temperature, and residence time based on feed material characteristics.", lang: "en" }],
    legal_status: { patent_status: "PENDING" },
    families: { simple_family: { size: 2 } }
  }
];

export function getMockResults(concept, options = {}) {
  const { yearFrom = 2020, yearTo = 2026, countries = [], size = 50, from = 0 } = options;

  let filtered = mockPatents.filter(p => {
    const year = parseInt(p.date_published?.substring(0, 4));
    if (year < yearFrom || year > yearTo) return false;
    if (countries.length > 0 && !countries.includes(p.jurisdiction)) return false;
    return true;
  });

  const total = filtered.length;
  filtered = filtered.slice(from, from + size);

  return {
    total,
    data: filtered,
    results: filtered
  };
}
