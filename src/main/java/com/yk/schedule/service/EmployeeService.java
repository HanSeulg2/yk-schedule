package com.yk.schedule.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.yk.schedule.model.Employee;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class EmployeeService {

    private static final String COLLECTION_NAME = "employees";

    public List<Employee> getAllEmployees() throws ExecutionException, InterruptedException {
        Firestore dbFirestore = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = dbFirestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        
        List<Employee> employeeList = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            Employee emp = document.toObject(Employee.class);
            if (emp != null) {
                emp.setId(document.getId());
                employeeList.add(emp);
            }
        }
        return employeeList;
    }

    public String saveEmployee(Employee employee) throws ExecutionException, InterruptedException {
        Firestore dbFirestore = FirestoreClient.getFirestore();
        if (employee.getId() == null || employee.getId().isEmpty()) {
            // Add new
            ApiFuture<DocumentReference> addedDocRef = dbFirestore.collection(COLLECTION_NAME).add(employee);
            return addedDocRef.get().getId();
        } else {
            // Update
            ApiFuture<WriteResult> collectionsApiFuture = dbFirestore.collection(COLLECTION_NAME).document(employee.getId()).set(employee);
            return collectionsApiFuture.get().getUpdateTime().toString();
        }
    }

    public String deleteEmployee(String documentId) {
        Firestore dbFirestore = FirestoreClient.getFirestore();
        ApiFuture<WriteResult> writeResult = dbFirestore.collection(COLLECTION_NAME).document(documentId).delete();
        return "Successfully deleted " + documentId;
    }
}
