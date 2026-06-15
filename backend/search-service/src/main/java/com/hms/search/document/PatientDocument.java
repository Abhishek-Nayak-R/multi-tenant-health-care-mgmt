package com.hms.search.document;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Document(indexName = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDocument {

    @Id
    private String id; // format: tenantId_postgresId

    @Field(type = FieldType.Keyword)
    private Long patientId;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String name;

    @Field(type = FieldType.Keyword)
    private String email;

    @Field(type = FieldType.Keyword)
    private String phone;

    @Field(type = FieldType.Keyword)
    private String medicalRecordNumber;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String diagnosis;

    @Field(type = FieldType.Keyword)
    private String tenantId;
}
