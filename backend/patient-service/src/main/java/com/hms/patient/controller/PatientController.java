package com.hms.patient.controller;

import com.hms.patient.entity.Patient;
import com.hms.patient.multitenancy.TenantContext;
import com.hms.patient.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientRepository patientRepository;
    private final RestTemplate restTemplate;

    @Value("${services.search-service.url}")
    private String searchServiceUrl;

    public PatientController(PatientRepository patientRepository, RestTemplate restTemplate) {
        this.patientRepository = patientRepository;
        this.restTemplate = restTemplate;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<Patient>> getAllPatients() {
        return ResponseEntity.ok(patientRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return patientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Patient> createPatient(@RequestBody Patient patient) {
        Patient savedPatient = patientRepository.save(patient);

        // Sync asynchronously or synchronously to the Elasticsearch Search Service
        syncToSearchService(savedPatient);

        return ResponseEntity.status(HttpStatus.CREATED).body(savedPatient);
    }

    private void syncToSearchService(Patient patient) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Forward the active Tenant ID context so search-service index matches the correct tenant database
            String currentTenant = TenantContext.getCurrentTenant();
            headers.set("X-TenantID", currentTenant);

            // Create a payload including the tenant information
            Map<String, Object> payload = Map.of(
                "id", patient.getId(),
                "name", patient.getName(),
                "email", patient.getEmail(),
                "phone", patient.getPhone(),
                "medicalRecordNumber", patient.getMedicalRecordNumber(),
                "diagnosis", patient.getDiagnosis(),
                "tenantId", currentTenant
            );

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);
            
            restTemplate.postForEntity(searchServiceUrl, requestEntity, Void.class);
            System.out.println("Successfully indexed patient in Elasticsearch for tenant: " + currentTenant);
        } catch (Exception e) {
            // Log warning but don't break the transactional create statement
            System.err.println("Failed to index patient in search service: " + e.getMessage());
        }
    }
}
