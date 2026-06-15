package com.hms.search.repository;

import com.hms.search.document.PatientDocument;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientSearchRepository extends ElasticsearchRepository<PatientDocument, String> {
    List<PatientDocument> findByTenantId(String tenantId);
    List<PatientDocument> findByNameContainingAndTenantId(String name, String tenantId);
}
