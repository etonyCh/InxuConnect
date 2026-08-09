package com.inzuconnect.inzuconnect_api;

import com.inzuconnect.inzuconnect_api.rag.LightRagService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class InzuconnectApiApplication {

	private static final Logger log = LoggerFactory.getLogger(InzuconnectApiApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(InzuconnectApiApplication.class, args);
	}

	@Bean
	public ApplicationRunner ragStartupIndexer(LightRagService lightRagService) {
		return args -> {
			try {
				LightRagService.IndexResult kb = lightRagService.indexKnowledgeBase();
				log.info("[LightRAG] Base de connaissances indexée: chunks={} entries={} note={}",
						kb.indexedChunks(), kb.sourceItems(), kb.note());
			} catch (Exception e) {
				log.warn("[LightRAG] Échec indexation KB au démarrage: {}", e.getMessage());
			}
			try {
				LightRagService.IndexResult listings = lightRagService.indexAllPublishedListings();
				log.info("[LightRAG] Annonces publiées indexées: chunks={} annonces={} note={}",
						listings.indexedChunks(), listings.sourceItems(), listings.note());
			} catch (Exception e) {
				log.warn("[LightRAG] Échec indexation annonces au démarrage: {}", e.getMessage());
			}
			log.info("[LightRAG] Taille totale du vector store: {}", lightRagService.storeSize());
		};
	}

}
